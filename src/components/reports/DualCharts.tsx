'use client';

import React from 'react';
import Panel from '@/components/ui/Panel';
import ChartFrame from '@/components/charts/ChartFrame';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

type Props = {
  // mặc định hiển thị nếu không truyền prop kind
  defaultMode?: 'expense' | 'income';
  monthsLimit?: number;
  showLegend?: boolean;
  month?: string; 
  kind?: 'expense' | 'income';
  onKindChange?: (k: 'expense' | 'income') => void;
};

type MonthlyPoint = { month: string; expense?: number; income?: number };
type CatPointRaw = { id?: number; name: string; expense?: number; income?: number };

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#0ea5e9', '#22c55e', '#a855f7'];
const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

function CustomLegend(props: any) {
  const { payload = [] } = props;
  return (
    <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 8 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <span
              style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: entry.color, flex: '0 0 auto' }}
            />
            <span style={{ fontSize: 12, color: 'var(--legend-text, #111827)' }}>{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DualCharts({
  defaultMode = 'expense',
  monthsLimit = 3,
  showLegend = true,
  month,
  kind: controlledKind,
  onKindChange,
}: Props) {
  const selectedMonth = month || new Date().toISOString().slice(0, 7);

  // nếu có prop kind thì dùng controlled, ngược lại dùng internal state
  const isControlled = controlledKind !== undefined && !!onKindChange;
  const [innerKind, setInnerKind] = React.useState<'income' | 'expense'>(defaultMode);
  const kind = (isControlled ? controlledKind : innerKind) ?? defaultMode;
  const setKind = (k: 'income' | 'expense') => {
    if (isControlled) onKindChange!(k);
    else setInnerKind(k);
  };

  // Monthly trends
  const monthly = useQuery({
    queryKey: ['reports', 'monthly-trends', { limit: monthsLimit, month: selectedMonth }],
    queryFn: async () => {
      const r = await fetch(`/api/reports/monthly-trends?limit=${monthsLimit}&month=${selectedMonth}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      const arr = (j.data as MonthlyPoint[]).slice().sort((a, b) => a.month.localeCompare(b.month));
      return arr;
    },
    staleTime: 60_000,
  });

  const monthlyMerged = React.useMemo(() => {
    const rows = monthly.data ?? [];
    return rows.map((r) => ({
      month: r.month,
      expense: Number(r.expense ?? 0),
      income: Number(r.income ?? 0),
    }));
  }, [monthly.data]);

  // Breakdown theo danh mục cho selectedMonth + kind
  const byCat = useQuery({
    queryKey: ['reports', 'category-breakdown', { kind, month: selectedMonth }],
    queryFn: async () => {
      const r = await fetch(`/api/reports/category-breakdown?kind=${kind}&month=${selectedMonth}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      return j.data as CatPointRaw[];
    },
    staleTime: 60_000,
  });

  const catData = React.useMemo(() => {
    const rows = (byCat.data ?? []).map((c) => ({
      name: c.name,
      value: kind === 'income' ? Number(c.income ?? 0) : Number(c.expense ?? 0),
    }));
    const total = rows.reduce((s, r) => s + r.value, 0) || 1;
    return rows
      .map((r) => ({ ...r, percent: (r.value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [byCat.data, kind]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
      {/* Toggle Thu/Chi dùng chung cho cả 2 chart (vẫn giữ ở trong component để tiện) */}
      <div className="lg:col-span-2 flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">Hiển thị:</span>
        <div className="inline-flex rounded-lg border bg-white dark:bg-zinc-900 overflow-hidden">
          <button
            onClick={() => setKind('expense')}
            className={`px-3 py-1 text-sm ${
              kind === 'expense'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 font-medium'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            Chi
          </button>
          <button
            onClick={() => setKind('income')}
            className={`px-3 py-1 text-sm ${
              kind === 'income'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 font-medium'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            Thu
          </button>
        </div>
      </div>

      {/* Cột: Thu & Chi theo tháng */}
      <Panel className="p-4 w-full min-w-0">
        <h2 className="text-lg font-semibold mb-3">
          Xu hướng {monthsLimit} tháng đến {selectedMonth}
        </h2>
        {monthly.isLoading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Đang tải biểu đồ…</p>
        ) : (
          <ChartFrame height={288}>
            {() => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMerged}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip
                    formatter={(value: any, _name: any, item: any) => {
                      const dk = item?.dataKey; // "income" | "expense"
                      const label = dk === 'income' ? 'Thu' : 'Chi';
                      return [fmtVND(Number(value)), label];
                    }}
                    labelFormatter={(l) => `Tháng ${l}`}
                  />
                  <Bar dataKey="income" name="Thu" radius={[6, 6, 0, 0]} fill="#10b981" />
                  <Bar dataKey="expense" name="Chi" radius={[6, 6, 0, 0]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartFrame>
        )}
      </Panel>

      {/* Tròn: Tỷ trọng theo danh mục */}
      <Panel className="p-4 w-full min-w-0">
        <h2 className="text-lg font-semibold mb-3">Tỷ trọng theo danh mục ({selectedMonth})</h2>
        {byCat.isLoading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Đang tải biểu đồ…</p>
        ) : (
          <ChartFrame height={288}>
            {() => (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={false}
                    labelLine={false}
                  >
                    {catData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, _k: any, item: any) => {
                      const pct = item?.payload?.percent ?? 0;
                      return [`${fmtVND(Number(v))} • ${pct.toFixed(1)}%`, item?.payload?.name];
                    }}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  {showLegend && (
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      content={<CustomLegend />}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartFrame>
        )}
      </Panel>
    </section>
  );
}
