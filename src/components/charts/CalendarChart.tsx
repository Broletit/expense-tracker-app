'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  getMonth,
  getYear,
  getDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAppSelector } from '../../hooks/reduxHooks';
import { selectAllExpenses } from '../../features/expenses/expensesSelectors';
import { useHasMounted } from '../../hooks/useHasMounted';

export default function CalendarChart() {
  const hasMounted = useHasMounted();
  const expenses = useAppSelector(selectAllExpenses);

  const now = hasMounted ? new Date() : new Date(2020, 0, 1);
  const [month, setMonth] = useState<number>(getMonth(now));
  const [year, setYear] = useState<number>(getYear(now));

  if (!hasMounted) return null;

  const currentDate = new Date(year, month);
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  const getTotalForDate = (date: Date) => {
    return expenses
      .filter((e) => isSameDay(new Date(e.date), date))
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Month and year selector */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Chi Tiêu Theo Lịch</h1>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md">
        <div className="grid grid-cols-7 gap-2 text-sm text-center">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
            <div key={d} className="font-semibold text-gray-500 dark:text-gray-300">
              {d}
            </div>
          ))}

          {Array(getDay(start)).fill(null).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map((date) => {
            const total = getTotalForDate(date);
            return (
              <div
                key={date.toISOString()}
                className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-900 flex flex-col items-center shadow-sm hover:shadow transition"
              >
                <div className="font-semibold text-gray-700 dark:text-white">
                  {format(date, 'd')}
                </div>
                <div
                  className={`mt-1 font-medium ${
                    total > 0 ? 'text-green-600' : 'text-gray-300'
                  }`}
                >
                  {total > 0 ? `${total.toLocaleString()}₫` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
