'use client';

import React from 'react';
import Panel from '@/components/ui/Panel';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

type MonthlyPoint = { month: string; total?: number; income?: number; expense?: number };
type CatPointRaw = { id?: number; name: string; total?: number; income?: number; expense?: number; value?: number };

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#0ea5e9', '#22c55e', '#a855f7'];

const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

// Helper: lấy value theo chế độ thu/chi, vẫn tương thích API cũ (total/value)
const pickValue = (row: any, kind: 'income' | 'expense') => {
  if (kind === 'income') return Number(row.income ?? row.total_income ?? row.value_income ?? 0);
  return Number(row.expense ?? row.total_expense ?? row.value_expense ?? row.total ?? row.value ?? 0);
};

export default function Charts() {
  const [kind, setKind] = React.useState<'income' | 'expense'>('expense');

  const monthlyExpense = useQuery({
    queryKey: ['reports', 'monthly-trends', { limit: 3, kind: 'expense' }],
    queryFn: async () => {
      const r = await fetch('/api/reports/monthly-trends?limit=3&kind=expense');
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      return (j.data as MonthlyPoint[]).slice().reverse();
    },
    staleTime: 60_000,
  });

  const monthlyIncome = useQuery({
    queryKey: ['reports', 'monthly-trends', { limit: 3, kind: 'income' }],
    queryFn: async () => {
      const r = await fetch('/api/reports/monthly-trends?limit=3&kind=income');
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      return (j.data as MonthlyPoint[]).slice().reverse();
    },
    staleTime: 60_000,
  });

  const monthlyMerged = React.useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    for (const e of monthlyExpense.data ?? []) {
      const month = e.month;
      const old = map.get(month) ?? { month, income: 0, expense: 0 };
      old.expense = Number(e.expense ?? e.total ?? 0);
      map.set(month, old);
    }
    for (const e of monthlyIncome.data ?? []) {
      const month = e.month;
      const old = map.get(month) ?? { month, income: 0, expense: 0 };
      old.income = Number(e.income ?? e.total ?? 0);
      map.set(month, old);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlyExpense.data, monthlyIncome.data]);

  // Category breakdown (theo lựa chọn kind) 
  const byCat = useQuery({
    queryKey: ['reports', 'category-breakdown', { kind }],
    queryFn: async () => {
      const r = await fetch(`/api/reports/category-breakdown?kind=${kind}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      return j.data as CatPointRaw[];
    },
    staleTime: 60_000,
  });

  // Chuẩn hoá + tính % cho pie
  const catData = React.useMemo(() => {
    const rows = (byCat.data ?? []).map((c) => ({
      name: c.name,
      value: pickValue(c, kind),
    }));
    const total = rows.reduce((s, r) => s + r.value, 0) || 1;
    return rows
      .map((r) => ({ ...r, percent: (r.value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [byCat.data, kind]);

  // Label phần trăm chỉ hiện với lát ≥ 5%
  const renderPercentLabel = (props: any) => {
    const { percent, name } = props.payload ?? {};
    if (!percent || percent * 100 < 5) return null;
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2 flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600">Hiển thị:</span>
        <div className="inline-flex rounded-lg border bg-white overflow-hidden">
          <button
            onClick={() => setKind('expense')}
            className={`px-3 py-1 text-sm ${kind === 'expense' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Chi
          </button>
          <button
            onClick={() => setKind('income')}
            className={`px-3 py-1 text-sm ${kind === 'income' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Thu
          </button>
        </div>
      </div>

      {/*  Biểu đồ cột: Thu & Chi theo tháng  */}
      <Panel className="p-4">
        <h2 className="text-lg font-semibold mb-3">Xu hướng 3 tháng gần nhất</h2>

        {(monthlyExpense.isLoading && monthlyIncome.isLoading) || !monthlyMerged.length ? (
          <p className="text-sm text-gray-600">Đang tải biểu đồ…</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyMerged}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip
                  formatter={(v: any, key: string) => [fmtVND(Number(v)), key === 'income' ? 'Thu' : 'Chi']}
                  labelFormatter={(l) => `Tháng ${l}`}
                />
                {/* Chi (đỏ) & Thu (xanh lục) */}
                <Bar dataKey="expense" name="Chi" radius={[6, 6, 0, 0]} fill="#ef4444" />
                <Bar dataKey="income"  name="Thu" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Biểu đồ tròn: Thu/Chi theo danh mục*/}
      <Panel className="p-4">
        <h2 className="text-lg font-semibold mb-3">Tỷ trọng theo danh mục</h2>

        {byCat.isLoading || !catData.length ? (
          <p className="text-sm text-gray-600">Đang tải biểu đồ…</p>
        ) : (
          <div className="h-72">
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

                {/* Tooltip: hiện số tiền và phần trăm khi hover */}
                <Tooltip
                  formatter={(v: any, _key: any, item: any) => {
                    const pct = item?.payload?.percent ?? 0;
                    return [`${fmtVND(Number(v))} • ${pct.toFixed(1)}%`, item?.payload?.name];
                  }}
                  wrapperStyle={{ fontSize: 12 }}
                />

                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  formatter={(value: string) => <span style={{ color: '#111827' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

    </section>
  );
}
