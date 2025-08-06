'use client';

import { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarChart() {
  const hasMounted = useHasMounted();
  const expenses = useAppSelector(selectAllExpenses);

  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    if (hasMounted) {
      const now = new Date();
      setMonth(getMonth(now));
      setYear(getYear(now));
    }
  }, [hasMounted]);

  if (!hasMounted || month === null || year === null) return null;

  const currentDate = new Date(year, month);
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  const getTotalForDate = (date: Date) => {
    return expenses
      .filter((e) => isSameDay(new Date(e.date), date))
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((prev) => (prev ?? 0) - 1);
    } else {
      setMonth((prev) => (prev ?? 0) - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((prev) => (prev ?? 0) + 1);
    } else {
      setMonth((prev) => (prev ?? 0) + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow space-y-6">
      <div className="p-4">
        {/* Month selector */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          aria-label="Tháng trước"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: vi })}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          aria-label="Tháng sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 text-sm text-center">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
          <div key={d} className="font-semibold text-gray-500">
            {d}
          </div>
        ))}

        {Array(getDay(start)).fill(null).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {daysInMonth.map((date) => {
          const total = getTotalForDate(date);
          const intensity = Math.min(255, total / 2000 * 255);
          const bgColor = total > 0 ? `rgba(34,197,94,${Math.min(0.7, intensity / 255)})` : 'transparent';

          return (
            <div
              key={date.toISOString()}
              title={`${format(date, 'dd/MM/yyyy')} - ${total.toLocaleString()}₫`}
              className="border rounded-lg p-2 flex flex-col items-center shadow-sm hover:shadow transition"
              style={{ backgroundColor: bgColor }}
            >
              <div className="font-semibold text-gray-800 dark:text-white">
                {format(date, 'd')}
              </div>
              <div className={`mt-1 text-xs ${total > 0 ? 'text-white font-semibold' : 'text-gray-300'}`}>
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
