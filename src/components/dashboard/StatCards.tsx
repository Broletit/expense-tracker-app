'use client';

import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";
import { formatCurrency } from "../../utils/formatCurrency";
import Card from "../ui/card";

export default function StatCards() {
  const expenses = useAppSelector(selectAllExpenses);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const uniqueDays = new Set(expenses.map((e) => e.date));
  const average = uniqueDays.size > 0 ? total / uniqueDays.size : 0;

  const max = expenses.reduce((max, e) => (e.amount > max ? e.amount : max), 0);

  return (
    <div className="grid sm:grid-cols-3 ">
      <div className="gap-4">
        <Card className="text-center">
        <p className="text-sm text-gray-500">Tổng chi</p>
        <p className="text-xl font-bold text-red-600">
          {formatCurrency(total)}
        </p>
      </Card>
      <Card className="text-center">
        <p className="text-sm text-gray-500">Trung bình / ngày</p>
        <p className="text-xl font-bold text-blue-600">
          {formatCurrency(average)}
        </p>
      </Card>
      <Card className="text-center">
        <p className="text-sm text-gray-500">Khoản chi lớn nhất</p>
        <p className="text-xl font-bold text-purple-600">
          {formatCurrency(max)}
        </p>
      </Card>
      </div>
    </div>
  );
}
