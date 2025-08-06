'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";

export default function TrendChart() {
  const expenses = useAppSelector(selectAllExpenses);

  const groupedByDate: Record<string, number> = {};

  expenses.forEach((e) => {
    if (!groupedByDate[e.date]) groupedByDate[e.date] = 0;
    groupedByDate[e.date] += e.amount;
  });

  const data = Object.entries(groupedByDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-lg text-center font-semibold mb-4">Xu hướng chi tiêu theo ngày</h2>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
