'use client';

import { useState } from 'react';
import { useExpenseStats } from '@/lib/queries/expenses';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import DualCharts from '@/components/reports/DualCharts';
import RecentTable from '@/components/dashboard/RecentTable';
import ExpensesStatsRow from '@/components/expenses/ExpensesStatsRow';

function monthToRange(m: string) {
  return { from: `${m}-01`, to: `${m}-31` };
}

export default function DashboardPage() {
  const [tab, setTab] = useState<'overview' | 'charts'>('overview');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const { from, to } = monthToRange(month);
  const { data: stats, isLoading, isFetching } = useExpenseStats({ from, to });

  const firstLoading = isLoading && !stats;

  //SKELETON LẦN ĐẦU 
  if (firstLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-40 h-9 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="w-24 h-9 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        {/* Stats row skeleton (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3 animate-pulse"
            >
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        {/* Content skeleton theo tab (overview/charts) – giả định overview mặc định */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 h-80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header: chọn tháng + tab + indicator đang fetch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Chọn tháng + trạng thái fetch */}
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-1.5 bg-white dark:bg-neutral-900"
          />

          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Đang cập nhật…
            </span>
          )}
        </div>

        {/* Tab 1/2 */}
        <div className="inline-flex rounded-md border overflow-hidden bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            }`}
          >
            1
          </button>
          <button
            onClick={() => setTab('charts')}
            className={`px-4 py-2 text-sm font-medium border-l dark:border-neutral-800 ${
              tab === 'charts'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            }`}
          >
            2
          </button>
        </div>
      </div>

      {/* Stats row – dùng dữ liệu thật, fallback 0 nếu chưa có */}
      <ExpensesStatsRow
        totalExpense={stats?.totalExpense ?? 0}
        totalIncome={stats?.totalIncome ?? 0}
        diff={stats?.diff ?? 0}
        maxExpense={stats?.maxExpense ?? 0}
      />

      {/* Nội dung theo tab */}
      {tab === 'overview' ? (
        <MonthlyCalendar month={month} />
      ) : (
        <>
          <DualCharts month={month} defaultMode="expense" monthsLimit={3} showLegend />
          <RecentTable month={month} />
        </>
      )}
    </div>
  );
}
