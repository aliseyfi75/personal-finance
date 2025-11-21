export interface AppSettings {
  googleClientId: string;
  geminiApiKey: string;
  portfolioSheetId: string;
  financialSheetId: string;
}

export interface PortfolioItem {
  name: string;
  investment: string;
  category: string;
  amount: number;
  price: number;
  currency: string;
  valueCAD: number;
  percent: number;
}

export interface FinancialRecord {
  date: string; // "16 April 2024"
  incomeBasic: number;
  incomeExtra: number;
  expenses: { [category: string]: number }; // Grocery, Rent, etc.
  netIncome: number;
  investments: {
    [accountType: string]: {
      contribution: number;
      currentValue: number;
    }
  };
  cash: { [account: string]: number };
  wealth: {
    liquid: number;
    fixed: number;
  };
  lostMoney: number;
}
