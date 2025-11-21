import { describe, it, expect } from 'vitest';
import { parsePortfolioData, parseFinancialData, aggregateMonthlyData } from './SheetsService';
import type { FinancialRecord } from '../types';

describe('SheetsService', () => {
  describe('parsePortfolioData', () => {
    it('should correctly parse portfolio rows', () => {
      const rows = [
        ['Name', 'Investment', 'Category', 'Amount', 'Price', 'Currency', 'Value (CAD)', 'Percent'],
        ['AAPL', 'Stock', 'Tech', '10', '$150.00', 'USD', '$2,000.00', '50%'],
        ['GOOGL', 'Stock', 'Tech', '5', '2800.00', 'USD', '18,000.00', '50%'],
        ['', '', '', '', '', '', '', ''] // Empty row
      ];

      const result = parsePortfolioData(rows);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'AAPL',
        investment: 'Stock',
        category: 'Tech',
        amount: 10,
        price: 150.00,
        currency: 'USD',
        valueCAD: 2000.00,
        percent: 0.50
      });
      expect(result[1].valueCAD).toBe(18000.00);
    });

    it('should handle missing or invalid data gracefully', () => {
       const rows = [
        ['Name', 'Investment', 'Category', 'Amount', 'Price', 'Currency', 'Value (CAD)', 'Percent'],
        ['Invalid', 'Stock', 'Tech', 'NaN', 'Invalid', 'USD', 'Invalid', 'Invalid']
      ];
       const result = parsePortfolioData(rows);
       // Since we filter item => item.name && item.valueCAD > 0
       expect(result).toHaveLength(0);
    });
  });

  describe('parseFinancialData', () => {
    it('should correctly parse hierarchical financial data', () => {
        // Adjusted headers to account for Column 0 being Date
        const rows = [
            ['Date', 'Income', '', 'Expense', '', 'Investment', 'Investment', 'Investment', 'Investment'], // Category
            ['', 'Basic', 'Extra', 'Rent', 'Food', 'RRSP', 'RRSP', 'TFSA', 'TFSA'], // Sub-category
            ['', '', '', '', '', 'Contribution', 'Current Value', 'Contribution', 'Current Value'], // Metric
            ['15 April 2024', '5000', '1000', '2000', '500', '1000', '10000', '500', '5000']
        ];

        const result = parseFinancialData(rows);

        expect(result).toHaveLength(1);
        const record = result[0];
        expect(record.date).toBe('15 April 2024');
        expect(record.incomeBasic).toBe(5000);
        expect(record.incomeExtra).toBe(1000);
        expect(record.expenses['Rent']).toBe(2000);
        expect(record.expenses['Food']).toBe(500);
        expect(record.investments['RRSP'].contribution).toBe(1000);
        expect(record.investments['RRSP'].currentValue).toBe(10000);
        expect(record.investments['TFSA'].contribution).toBe(500);
        expect(record.investments['TFSA'].currentValue).toBe(5000);
    });
  });

  describe('aggregateMonthlyData', () => {
      it('should aggregate daily records into monthly records', () => {
        const records: FinancialRecord[] = [
            {
                date: '01 April 2024',
                incomeBasic: 2000,
                incomeExtra: 0,
                expenses: { Rent: 1000 },
                netIncome: 1000,
                investments: { RRSP: { contribution: 500, currentValue: 10000 } },
                cash: { Checking: 1000 },
                wealth: { liquid: 5000, fixed: 0 },
                lostMoney: 0
            },
            {
                date: '15 April 2024',
                incomeBasic: 2000,
                incomeExtra: 500,
                expenses: { Food: 200 },
                netIncome: 2300,
                investments: { RRSP: { contribution: 500, currentValue: 10500 } }, // Updated snapshot
                cash: { Checking: 1200 }, // Updated snapshot
                wealth: { liquid: 5200, fixed: 0 },
                lostMoney: 0
            },
             {
                date: '01 May 2024',
                incomeBasic: 2000,
                incomeExtra: 0,
                expenses: { Rent: 1000 },
                netIncome: 1000,
                investments: { RRSP: { contribution: 500, currentValue: 11000 } },
                cash: { Checking: 800 },
                wealth: { liquid: 4800, fixed: 0 },
                lostMoney: 0
            }
        ];

        const aggregated = aggregateMonthlyData(records);

        expect(aggregated).toHaveLength(2);

        // April 2024
        const april = aggregated.find(r => r.date === 'April 2024');
        expect(april).toBeDefined();
        if (april) {
            expect(april.incomeBasic).toBe(4000); // Sum
            expect(april.incomeExtra).toBe(500); // Sum
            expect(april.expenses['Rent']).toBe(1000); // Sum
            expect(april.expenses['Food']).toBe(200); // Sum
            expect(april.investments['RRSP'].contribution).toBe(1000); // Sum
            expect(april.investments['RRSP'].currentValue).toBe(10500); // Latest Snapshot
            expect(april.cash['Checking']).toBe(1200); // Latest Snapshot
        }

        // May 2024
        const may = aggregated.find(r => r.date === 'May 2024');
        expect(may).toBeDefined();
        if(may) {
             expect(may.incomeBasic).toBe(2000);
             expect(may.investments['RRSP'].contribution).toBe(500);
             expect(may.investments['RRSP'].currentValue).toBe(11000);
        }
      });
  });
});
