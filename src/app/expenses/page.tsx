'use client';

import { useState } from "react";
import FilterPanel from "../../components/ui/FilterPanel";
import ExpenseList from "../../components/expenses/ExpenseList";
import AddExpenseModal from "../../components/expenses/AddExpenseModal";

export default function ExpensesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danh Sách Chi Tiêu</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Thêm Chi Tiêu
        </button>
      </div>

      <FilterPanel />
      <ExpenseList />

      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
