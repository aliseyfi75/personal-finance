import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SimulationProps {
  initialPortfolioValue: number;
}

interface SimulationResult {
  day: number;
  value: number;
  p10: number; // 10th percentile
  p90: number; // 90th percentile
}

export const Simulation: React.FC<SimulationProps> = ({ initialPortfolioValue }) => {
  const [dailyContribution, setDailyContribution] = useState<number>(100);
  const [years, setYears] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(0.07); // 7% annual
  const [volatility, setVolatility] = useState<number>(0.15); // 15% annual
  const [results, setResults] = useState<SimulationResult[]>([]);

  useEffect(() => {
    runSimulation();
  }, [initialPortfolioValue]); // Run on mount/prop change, but manual run for params

  const runSimulation = () => {
    const simulations = 100; // Number of paths
    const days = years * 365;
    const dt = 1 / 365;

    // Arrays to store end-of-day values for all sims
    // We can't store every day for every sim for display, too heavy.
    // We will calculate statistics per day.

    // Initialize paths
    let paths = Array(simulations).fill(initialPortfolioValue);

    const chartData: SimulationResult[] = [];

    // Pre-calculate drift and diffusion constants
    // dS = S * (mu * dt + sigma * dW) + Contribution
    // Discrete: S_t+1 = S_t * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z) + DailyContrib

    const drift = (expectedReturn - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    // We step day by day
    // To optimize rendering, we might aggregate by month for the chart, but simulate daily.

    for (let t = 0; t <= days; t++) {
      if (t > 0) {
        // Update all paths
        for (let i = 0; i < simulations; i++) {
            const Z = boxMullerTransform();
            const growth = Math.exp(drift + diffusion * Z);
            paths[i] = paths[i] * growth + dailyContribution;
        }
      }

      // Record stats every ~30 days or start/end
      if (t % 30 === 0 || t === days) {
        paths.sort((a, b) => a - b);
        chartData.push({
            day: t,
            value: paths[Math.floor(simulations * 0.5)], // Median
            p10: paths[Math.floor(simulations * 0.1)],
            p90: paths[Math.floor(simulations * 0.9)]
        });
      }
    }

    setResults(chartData);
  };

  // Standard Normal random generator
  const boxMullerTransform = () => {
    const u1 = Math.random();
    const u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Monte Carlo Projection</h2>
        <button
          onClick={runSimulation}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Run Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Contribution ($)</label>
          <input
            type="number"
            value={dailyContribution}
            onChange={(e) => setDailyContribution(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years to Project</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(parseFloat(e.target.value) || 10)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (Annual %)</label>
          <input
            type="number"
            value={expectedReturn * 100}
            onChange={(e) => setExpectedReturn((parseFloat(e.target.value) || 0) / 100)}
            className="w-full p-2 border rounded"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Volatility (Annual %)</label>
          <input
            type="number"
            value={volatility * 100}
            onChange={(e) => setVolatility((parseFloat(e.target.value) || 0) / 100)}
            className="w-full p-2 border rounded"
            step="0.1"
          />
        </div>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="day"
                tickFormatter={(val) => `Year ${(val / 365).toFixed(0)}`}
                type="number"
                domain={['dataMin', 'dataMax']}
            />
            <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} labelFormatter={(val) => `Year ${(val / 365).toFixed(1)}`} />
            <Line type="monotone" dataKey="p90" stroke="#82ca9d" strokeDasharray="5 5" name="Optimistic (90th)" dot={false} />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Median" dot={false} />
            <Line type="monotone" dataKey="p10" stroke="#ff8042" strokeDasharray="5 5" name="Pessimistic (10th)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-sm text-gray-500">
        * Simulates 100 scenarios using Geometric Brownian Motion with daily contributions.
      </div>
    </div>
  );
};
