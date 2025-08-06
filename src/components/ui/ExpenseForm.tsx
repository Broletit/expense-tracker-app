'use client';

import { useState } from "react";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { addExpense, updateExpense } from "../../features/expenses/expensesSlice";
import { categories } from "../../constants/categories";
import { Expense } from "../../types";

type Props = {
  initialData?: Expense;
  onClose: () => void;
};

export default function ExpenseForm({ initialData, onClose }: Props) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || categories[0].name);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Vui lòng nhập đúng số tiền và mô tả.");
      return;
    }

    const expenseData: Omit<Expense, "id"> = {
      amount: parsedAmount,
      description,
      category,
      date,
    };

    if (initialData) {
      dispatch(updateExpense({ ...expenseData, id: initialData.id }));
    } else {
      dispatch(addExpense(expenseData));
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 font-medium">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*\.?[0-9]*$"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900"
          placeholder="VD: 50000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mô tả</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900"
          placeholder="VD: Ăn sáng"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Danh mục</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900"
        >
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ngày</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900"
          required
        />
      </div>
      <div className="flex justify-center gap-6 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition"
        >
          Hủy
        </button>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white border border-green-700 rounded-lg hover:bg-green-700 transition"
        >
          {initialData ? "Cập nhật" : "Thêm"}
        </button>

      </div>

    </form>
  );
}
