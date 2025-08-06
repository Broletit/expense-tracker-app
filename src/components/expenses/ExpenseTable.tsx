'use client';

import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ExpenseTable() {
  const expenses = useAppSelector(selectAllExpenses);

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="px-4 py-2 text-left">Ngày</th>
            <th className="px-4 py-2 text-left">Mô tả</th>
            <th className="px-4 py-2 text-left">Danh mục</th>
            <th className="px-4 py-2 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700">
              <td className="px-4 py-2">{e.date}</td>
              <td className="px-4 py-2">{e.description}</td>
              <td className="px-4 py-2">{e.category}</td>
              <td className="px-4 py-2 text-right text-red-600">{formatCurrency(e.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
