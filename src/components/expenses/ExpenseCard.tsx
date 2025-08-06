'use client';

import { Expense } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { deleteExpense } from "../../features/expenses/expensesSlice";
import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";

type Props = {
  expense: Expense;
};

export default function ExpenseCard({ expense }: Props) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);

  const handleDelete = () => {
    if (confirm("Bạn có chắc muốn xoá khoản chi này?")) {
      dispatch(deleteExpense(expense.id));
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold">{expense.description}</p>
          <p className="text-xs text-gray-500">{expense.date} • {expense.category}</p>
        </div>
        <div className="text-right">
            <p className="text-red-600 font-bold">{formatCurrency(expense.amount)}</p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition text-sm"
              >
                Sửa
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900 transition text-sm"
              >
                Xoá
              </button>
            </div>
          </div>

      </div>

      {editing && (
        <AddExpenseModal onClose={() => setEditing(false)} initialData={expense} />
      )}
    </>
  );
}
