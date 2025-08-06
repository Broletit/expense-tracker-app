'use client';

import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";
import { selectFilters } from "../../features/filters/filtersSelectors";
import ExpenseCard from "./ExpenseCard";
import { useState, useEffect } from "react";

export default function ExpenseList() {
  const expenses = useAppSelector(selectAllExpenses);
  const filters = useAppSelector(selectFilters);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtered, setFiltered] = useState<typeof expenses>([]);

  useEffect(() => {
    try {
      setLoading(true);
      const result = expenses.filter((e) => {
        const matchesSearch = e.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory =
          filters.categories.length === 0 || filters.categories.includes(e.category);
        const matchesMin = filters.minAmount == null || e.amount >= filters.minAmount;
        const matchesMax = filters.maxAmount == null || e.amount <= filters.maxAmount;
        const matchesDate =
          !filters.dateRange ||
          (e.date >= filters.dateRange[0] && e.date <= filters.dateRange[1]);

        return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesDate;
      });

      setFiltered(result);
      setError(null);
    } catch (err) {
      setError("Đã xảy ra lỗi khi lọc dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [expenses, filters]);

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sortOption) {
      case "date-asc":
        return a.date.localeCompare(b.date);
      case "date-desc":
        return b.date.localeCompare(a.date);
      case "amount-asc":
        return a.amount - b.amount;
      case "amount-desc":
        return b.amount - a.amount;
      case "desc-asc":
        return a.description.localeCompare(b.description);
      case "desc-desc":
        return b.description.localeCompare(a.description);
      default:
        return 0;
    }
  });

  if (loading) {
    return <p className="text-sm text-gray-500 animate-pulse">Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">Không có khoản chi nào phù hợp.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((e) => (
        <ExpenseCard key={e.id} expense={e} />
      ))}
    </div>
  );
}
