'use client';

import { useEffect } from "react";
import ExpenseForm from "../ui/ExpenseForm";
import { Expense } from "../../types";

type Props = {
  onClose: () => void;
  initialData?: Expense;
};

export default function AddExpenseModal({ onClose, initialData }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-xl ">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-400 hover:text-red-500"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          {initialData ? "Chỉnh sửa khoản chi" : "Thêm khoản chi"}
        </h2>
        <ExpenseForm onClose={onClose} initialData={initialData} />
      </div>
    </div>
  );
}
