import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import type { PortfolioItem, FinancialRecord } from '../types';

interface DashboardProps {
  portfolio: PortfolioItem[];
  financials: FinancialRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const Dashboard: React.FC<DashboardProps> = ({ portfolio, financials }) => {
  // --- Portfolio Data Prep ---
  const allocationData = portfolio.reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.investment);
    if (existing) {
      existing.value += item.valueCAD;
    } else {
      acc.push({ name: item.investment, value: item.valueCAD });
    }
    return acc;
  }, [] as { name: string, value: number }[]).sort((a, b) => b.value - a.value);

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + item.valueCAD, 0);

  // --- Financial Data Prep ---
  // Financials are already aggregated by month if passed from the Service
  const incomeExpenseData = financials.map(r => ({
    name: r.date,
    Income: r.incomeBasic + r.incomeExtra,
    Expenses: Object.values(r.expenses).reduce((a, b) => a + b, 0),
    Savings: r.netIncome // Or Income - Expenses
  }));

  const netWorthData = financials.map(r => ({
    name: r.date,
    Liquid: r.wealth.liquid,
    Fixed: r.wealth.fixed,
    Total: r.wealth.liquid + r.wealth.fixed
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Net Worth</h3>
          <p className="text-3xl font-bold text-gray-900">
            ${netWorthData[netWorthData.length - 1]?.Total.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Portfolio Value</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${totalPortfolioValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Monthly Burn (Avg)</h3>
          <p className="text-3xl font-bold text-red-500">
            ${(incomeExpenseData.reduce((sum, d) => sum + d.Expenses, 0) / (incomeExpenseData.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Allocation */}
        <div className="bg-white p-6 rounded-lg shadow h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
              >
                {allocationData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expenses */}
        <div className="bg-white p-6 rounded-lg shadow h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Income" fill="#00C49F" />
              <Bar dataKey="Expenses" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Net Worth History */}
        <div className="bg-white p-6 rounded-lg shadow h-96 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Net Worth History</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="Liquid" stroke="#8884d8" />
              <Line type="monotone" dataKey="Fixed" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Total" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
