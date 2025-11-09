'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DualCharts from '@/components/reports/DualCharts';
import DailyLines from '@/components/reports/DailyLines';
import SharePopover from '@/components/reports/SharePopover';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type ExportFormat = 'csv' | 'pdf' | 'excel';

type CategoryRow = { id: number; name: string; expense: number; income: number };
type DailyRow = { day: string; expense: number; income: number };
type TopTx = {
  id: number;
  date: string;
  kind: 'expense' | 'income';
  category: string;
  description: string;
  amount: number;
};

const currency = (n: number) => (Number(n) || 0).toLocaleString('vi-VN');
const fmtVN = (n: number) => (Number(n) || 0).toLocaleString('vi-VN');

async function getJSON<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export default function ReportsPage() {
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // fetch data cho các section 
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topExp, setTopExp] = useState<TopTx[] | null>(null);
  const [topInc, setTopInc] = useState<TopTx[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!initialLoading) setRefreshing(true);

      try {
        const cat = await getJSON<{ data: CategoryRow[] }>(
          `/api/reports/category-breakdown?month=${encodeURIComponent(month)}`
        );
        if (!cancelled) setCategories(cat?.data ?? []);

        const d = await getJSON<{ data: DailyRow[] }>(
          `/api/reports/daily-spending?month=${encodeURIComponent(month)}`
        );
        if (!cancelled) setDaily(d?.data ?? []);

        const [eTop, iTop] = await Promise.all([
          getJSON<{ data: TopTx[] }>(
            `/api/reports/top-transactions?month=${encodeURIComponent(month)}&kind=expense&limit=10`
          ),
          getJSON<{ data: TopTx[] }>(
            `/api/reports/top-transactions?month=${encodeURIComponent(month)}&kind=income&limit=10`
          ),
        ]);

        if (!cancelled) {
          setTopExp(eTop?.data ?? null);
          setTopInc(iTop?.data ?? null);
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [month, initialLoading]);

  // Weekday aggregation from daily 
  const weekdayAgg = useMemo(() => {
    const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const map = new Map<string, { expense: number; income: number }>();
    names.forEach((n) => map.set(n, { expense: 0, income: 0 }));
    for (const d of daily) {
      const idx = new Date(d.day).getDay(); // 0=CN
      const key = names[idx] ?? 'CN';
      const cur = map.get(key)!;
      cur.expense += Number(d.expense || 0);
      cur.income += Number(d.income || 0);
    }
    const order = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const rows = order.map((k) => ({ day: k, ...(map.get(k) || { expense: 0, income: 0 }) }));
    const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.expense, r.income)));
    return { rows, maxVal };
  }, [daily]);

  //EXPORT 
  async function doExport(format: ExportFormat) {
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, month }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(j.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'excel' ? 'xlsx' : format; 
      a.download = `report-${month}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Không xuất được file');
    } finally {
      setOpenExport(false);
    }
  }

  // SNAPSHOT FOR SHARE
  async function buildSnapshot() {
    const [mRes, cRes, dRes] = await Promise.all([
      fetch(`/api/reports/monthly-trends?limit=3&month=${encodeURIComponent(month)}`),
      fetch(`/api/reports/category-breakdown?month=${encodeURIComponent(month)}`),
      fetch(`/api/reports/daily-spending?month=${encodeURIComponent(month)}`),
    ]);
    const [mJ, cJ, dJ] = await Promise.all([mRes.json(), cRes.json(), dRes.json()]);
    return {
      generatedAt: new Date().toISOString(),
      monthly: mJ?.data ?? [],
      categories: cJ?.data ?? [],
      daily: dJ?.data ?? [],
    };
  }

  // CLOSE EXPORT DROPDOWN
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (openExport && exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setOpenExport(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenExport(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [openExport]);

  if (initialLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>

        {/* DualCharts skeleton */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 h-72 animate-pulse" />

        {/* DailyLines skeleton */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 h-72 animate-pulse" />

        {/* Weekday chart skeleton */}
        <section className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 h-64 animate-pulse" />
        </section>

        {/* Top categories skeleton */}
        <section className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                {Array.from({ length: 5 }).map((__, j) => (
                  <div key={j} className="flex justify-between gap-3">
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Top transactions skeleton */}
        <section className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                {Array.from({ length: 4 }).map((__, j) => (
                  <div
                    key={j}
                    className="grid grid-cols-4 gap-3 items-center"
                  >
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/*Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Chọn tháng + trạng thái refresh */}
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-1.5 bg-white dark:bg-neutral-900"
          />

          {refreshing && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Đang cập nhật…
            </span>
          )}
        </div>

        {/* Export & Share buttons */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setOpenExport((v) => !v)}
              className="px-3 py-1 rounded border bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700"
              aria-haspopup="menu"
              aria-expanded={openExport}
            >
              Xuất
            </button>

            {openExport && (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-[140px] bg-white border rounded-md shadow-lg z-20 overflow-hidden dark:bg-zinc-800 dark:border-zinc-700"
              >
                <button
                  role="menuitem"
                  onClick={() => doExport('csv')}
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  CSV
                </button>
                <button
                  role="menuitem"
                  onClick={() => doExport('pdf')}
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  PDF
                </button>
                <button
                  role="menuitem"
                  onClick={() => doExport('excel')}
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  Excel
                </button>
              </div>
            )}
          </div>

          {/* Share popover */}
          <SharePopover buildSnapshot={buildSnapshot} />
        </div>
      </div>

      {/*Charts*/}
      <div className="w-full">
        <DualCharts defaultMode="expense" monthsLimit={3} showLegend month={month} />
      </div>

      <div className="w-full">
        <DailyLines month={month} />
      </div>

      {/*Weekday Allocation (GROUPED BAR CHART)*/}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Phân bổ theo thứ
        </h3>
        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={weekdayAgg.rows}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => fmtVN(v)} />
                <Tooltip
                  formatter={(v: any) => fmtVN(v as number)}
                  labelFormatter={(l) => `Thứ: ${l}`}
                />
                <Legend />
                <Bar name="Thu" dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar name="Chi" dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Top Categories (Expense / Income) */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Top danh mục
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense */}
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium">Chi</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Danh mục</th>
                  <th className="py-1 text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {[...categories]
                  .map((c) => ({ name: c.name, v: c.expense || 0 }))
                  .sort((a, b) => b.v - a.v)
                  .slice(0, 8)
                  .map((r, i) => (
                    <tr
                      key={`${r.name}-${i}`}
                      className={i % 2 === 0 ? 'bg-gray-50/60 dark:bg-zinc-800/50' : ''}
                    >
                      <td className="py-1.5 pr-2">{r.name || 'Khác'}</td>
                      <td className="py-1.5 pl-2 text-right">{currency(r.v)} đ</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Income */}
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium">Thu</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Danh mục</th>
                  <th className="py-1 text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {[...categories]
                  .map((c) => ({ name: c.name, v: c.income || 0 }))
                  .sort((a, b) => b.v - a.v)
                  .slice(0, 8)
                  .map((r, i) => (
                    <tr
                      key={`${r.name}-${i}`}
                      className={i % 2 === 0 ? 'bg-gray-50/60 dark:bg-zinc-800/50' : ''}
                    >
                      <td className="py-1.5 pr-2">{r.name || 'Khác'}</td>
                      <td className="py-1.5 pl-2 text-right">{currency(r.v)} đ</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/*Top Transactions (Expense / Income)*/}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Top giao dịch
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense */}
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium">Chi</div>
            {topExp ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">Ngày</th>
                    <th className="py-1">Danh mục</th>
                    <th className="py-1">Ghi chú</th>
                    <th className="py-1 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {topExp.slice(0, 10).map((t, i) => (
                    <tr
                      key={t.id}
                      className={i % 2 === 0 ? 'bg-gray-50/60 dark:bg-zinc-800/50' : ''}
                    >
                      <td className="py-1.5">{t.date?.slice(0, 10)}</td>
                      <td className="py-1.5">{t.category || ''}</td>
                      <td className="py-1.5">{t.description || ''}</td>
                      <td className="py-1.5 text-right">{currency(t.amount)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-gray-500">
                Chưa có endpoint{' '}
                <code className="px-1 rounded bg-gray-100 dark:bg-zinc-800">
                  /api/reports/top-transactions?kind=expense
                </code>
                . Vui lòng tạo API hoặc bỏ phần này.
              </div>
            )}
          </div>

          {/* Income */}
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-2 text-sm font-medium">Thu</div>
            {topInc ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">Ngày</th>
                    <th className="py-1">Danh mục</th>
                    <th className="py-1">Ghi chú</th>
                    <th className="py-1 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {topInc.slice(0, 10).map((t, i) => (
                    <tr
                      key={t.id}
                      className={i % 2 === 0 ? 'bg-gray-50/60 dark:bg-zinc-800/50' : ''}
                    >
                      <td className="py-1.5">{t.date?.slice(0, 10)}</td>
                      <td className="py-1.5">{t.category || ''}</td>
                      <td className="py-1.5">{t.description || ''}</td>
                      <td className="py-1.5 text-right">{currency(t.amount)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-gray-500">
                Chưa có endpoint{' '}
                <code className="px-1 rounded bg-gray-100 dark:bg-zinc-800">
                  /api/reports/top-transactions?kind=income
                </code>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
