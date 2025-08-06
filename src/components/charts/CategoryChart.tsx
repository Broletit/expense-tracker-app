'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";
import { categories } from "../../constants/categories";
import { CHART_COLORS } from "../../constants/colors";

export default function CategoryChart() {
  const expenses = useAppSelector(selectAllExpenses);

  const data = categories.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: cat.name,
      value: total,
    };
  }).filter(d => d.value > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-lg text-center font-semibold mb-4">Phân bổ theo danh mục</h2>
      <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
      </div>
      
    </div>
  );
}
