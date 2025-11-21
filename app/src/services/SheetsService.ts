import { gapi } from 'gapi-script';
import type { PortfolioItem, FinancialRecord } from '../types';

export const fetchSpreadsheetData = async (spreadsheetId: string, range: string) => {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.result.values;
};

// --- Portfolio Parser ---
export const parsePortfolioData = (rows: any[]): PortfolioItem[] => {
  // Assuming header is row 0. We start from row 1.
  // Columns: Name, Investment, Category, Amount, Price, Currency, Value (CAD), Percent
  // const headers = rows[0].map((h: string) => h.toLowerCase());
  const data = rows.slice(1);

  return data.map(row => {
    // Map columns by index if possible, but strict order is safer if we assume template
    // Indexes based on description:
    // 0: Name, 1: Investment, 2: Category, 3: Amount, 4: Price, 5: Currency, 6: Value (CAD), 7: Percent
    return {
      name: row[0],
      investment: row[1],
      category: row[2],
      amount: parseFloat(row[3]?.replace(/,/g, '') || '0'),
      price: parseFloat(row[4]?.replace(/[\$,]/g, '') || '0'),
      currency: row[5],
      valueCAD: parseFloat(row[6]?.replace(/[\$,]/g, '') || '0'),
      percent: parseFloat(row[7]?.replace(/[%]/g, '') || '0') / 100
    };
  }).filter(item => item.name && item.valueCAD > 0); // Filter empty rows
};

// --- Financial Planning Parser ---
// This handles the hierarchical structure.
// Row 1: Categories (Income, Expense, etc.) - merged
// Row 2: Sub-categories (RRSP, TFSA, etc.)
// Row 3: Metrics (Contribution, Current Value) - for Investment
// Data starts Row 4
export const parseFinancialData = (rows: any[]): FinancialRecord[] => {
  // We need to map column indexes to their semantic meaning based on the first 3 rows.
  // This is complex because of merged cells. The API returns values in the top-left cell of a merge.
  // But `values.get` returns a 2D array where empty cells are just empty strings or undefined.
  // Wait, `values.get` does NOT return merged info. It returns the value in the first cell, and others are empty?
  // Actually, standard `values.get` just returns the grid values. If A1:B1 is merged and has "Income", row[0] is "Income", row[1] is "".

  const row1 = rows[0]; // Category
  const row2 = rows[1]; // Sub-category
  const row3 = rows[2]; // Metrics

  const dataRows = rows.slice(3);
  const records: FinancialRecord[] = [];

  // Helper to find the current "active" category from Row 1 as we iterate columns
  let currentCategory = '';
  let currentSubCategory = '';

  // We will build a map of column index -> { category, subCategory, metric }
  const colMap: { [index: number]: { category: string, subCategory: string, metric: string } } = {};

  for (let i = 0; i < row1.length; i++) {
    if (row1[i]) currentCategory = row1[i];
    if (row2[i]) currentSubCategory = row2[i];
    // If row2[i] is empty, it inherits from previous or it's just N/A.
    // In the user description: "Income" -> "Basic", "Extra". These are in Row 2.
    // "Investment" -> "RRSP" -> "Contribution", "Current Value".
    // So for Investment: Row 1 is Investment. Row 2 is RRSP. Row 3 is Contribution.
    // Next col: Row 1 is "" (merged), Row 2 is "" (merged), Row 3 is "Current Value".

    // We need to fill forward the category and subCategory if they are part of a merge block.
    // But how do we know if it's a merge block or just a new empty column?
    // We assume the structure provided:
    // "Investment" spans multiple columns.
    // "RRSP" spans 2 columns (Contribution, Current Value).

    // Logic: If Row 1 has value, update currentCategory.
    // If Row 2 has value, update currentSubCategory.
    // Row 3 always has the metric name? Or sometimes Row 2 is the metric (like for Income/Expense)?

    // User description:
    // "Income: Split into Basic and Extra". Implies Row 1=Income, Row 2=Basic/Extra. Row 3 might be empty or redundant?
    // "Investment: For every account type... track two columns: Contribution, Current Value". Implies Row 3 has these.

    // Let's refine the map builder.
    const metric = row3[i] || '';

    colMap[i] = {
      category: currentCategory,
      subCategory: currentSubCategory,
      metric: metric
    };
  }

  dataRows.forEach(row => {
    // Skip if date is missing
    if (!row[0]) return;

    const record: FinancialRecord = {
      date: row[0],
      incomeBasic: 0,
      incomeExtra: 0,
      expenses: {},
      netIncome: 0,
      investments: {},
      cash: {},
      wealth: { liquid: 0, fixed: 0 },
      lostMoney: 0
    };

    row.forEach((cellValue: string, index: number) => {
      if (index === 0) return; // Date
      const map = colMap[index];
      if (!map) return;

      const val = parseFloat(cellValue?.replace(/[\$,]/g, '') || '0');

      const cat = map.category.toLowerCase();
      const sub = map.subCategory; // Keep case for display?
      const met = map.metric.toLowerCase();

      if (cat.includes('income')) {
        // Check sub for Basic vs Extra
        if (sub.toLowerCase().includes('basic')) record.incomeBasic += val;
        else if (sub.toLowerCase().includes('extra')) record.incomeExtra += val;
        else if (sub.toLowerCase().includes('net')) record.netIncome = val; // "Net Income" might be its own category or sub
      }
      else if (cat.includes('expense')) {
        if (sub) record.expenses[sub] = (record.expenses[sub] || 0) + val;
      }
      else if (cat.includes('net income')) {
         record.netIncome = val;
      }
      else if (cat.includes('investment')) {
        // sub is Account Type (RRSP)
        // met is Contribution or Current Value
        if (sub) {
          if (!record.investments[sub]) record.investments[sub] = { contribution: 0, currentValue: 0 };

          if (met.includes('contribution')) record.investments[sub].contribution = val;
          else if (met.includes('current') || met.includes('value')) record.investments[sub].currentValue = val;
        }
      }
      else if (cat.includes('cash')) {
        if (sub) record.cash[sub] = val;
      }
      else if (cat.includes('wealth')) {
        if (sub.toLowerCase().includes('liquid')) record.wealth.liquid = val;
        else if (sub.toLowerCase().includes('fixed')) record.wealth.fixed = val;
      }
      else if (cat.includes('lost')) {
        record.lostMoney = val;
      }
    });

    records.push(record);
  });

  return records;
};

// --- Aggregation ---
export const aggregateMonthlyData = (records: FinancialRecord[]): FinancialRecord[] => {
  const grouped: { [key: string]: FinancialRecord } = {};

  records.forEach(r => {
    // Parse date: "16 April 2024"
    const parts = r.date.split(' ');
    // Assuming "Day Month Year"
    if (parts.length < 3) return;
    const monthYear = `${parts[1]} ${parts[2]}`; // "April 2024"

    if (!grouped[monthYear]) {
      // Clone structure
      grouped[monthYear] = {
        date: monthYear,
        incomeBasic: 0,
        incomeExtra: 0,
        expenses: {},
        netIncome: 0,
        investments: {},
        cash: {}, // Cash is a snapshot, usually we take the latest? Or sum?
                  // Cash balance is a SNAPSHOT. We should take the latest entry in the month.
                  // BUT Income/Expense/Contribution are FLOWS. We sum them.
        wealth: { liquid: 0, fixed: 0 }, // Snapshot
        lostMoney: 0 // Flow? Or snapshot? Likely flow if "tracking losses". Let's assume flow.
      };
    }

    const acc = grouped[monthYear];

    // Sum Flows
    acc.incomeBasic += r.incomeBasic;
    acc.incomeExtra += r.incomeExtra;
    acc.netIncome += r.netIncome; // Sum net income flows
    acc.lostMoney += r.lostMoney;

    Object.entries(r.expenses).forEach(([k, v]) => {
      acc.expenses[k] = (acc.expenses[k] || 0) + v;
    });

    Object.entries(r.investments).forEach(([k, v]) => {
      if (!acc.investments[k]) acc.investments[k] = { contribution: 0, currentValue: 0 };
      acc.investments[k].contribution += v.contribution;
      // Current Value is a Snapshot. We should take the LATEST.
      // Since we iterate chronologically (assuming source is sorted), we just overwrite.
      acc.investments[k].currentValue = v.currentValue;
    });

    // Snapshots: Overwrite with latest
    Object.entries(r.cash).forEach(([k, v]) => {
      acc.cash[k] = v;
    });
    acc.wealth = r.wealth; // Overwrite
  });

  // Convert back to array
  // We need to sort by date. But "April 2024" is hard to sort string-wise.
  // We rely on the input order being chronological.
  return Object.values(grouped);
};
