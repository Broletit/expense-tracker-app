'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";

export default function MonthlyCompareChart() {
  const expenses = useAppSelector(selectAllExpenses);

  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const thisYear = now.getFullYear();
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const currentMonthTotal = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((sum, e) => sum + e.amount, 0);

  const previousMonthTotal = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  }).reduce((sum, e) => sum + e.amount, 0);

  const data = [
    { name: "Tháng trước", value: previousMonthTotal },
    { name: "Tháng này", value: currentMonthTotal },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-center text-lg font-semibold mb-4">So sánh chi tiêu hàng tháng</h2>
        <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#14a474ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
    </div>
  );
}
