'use client';

import React from 'react';
import Panel from '@/components/ui/Panel';
import ChartFrame from '@/components/charts/ChartFrame';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type Props = { month?: string };
const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

export default function DailyLines({ month }: Props) {
  const selectedMonth = month || new Date().toISOString().slice(0, 7);
  const q = useQuery({
    queryKey: ['reports', 'daily-spending', { month: selectedMonth }],
    queryFn: async () => {
      const r = await fetch(`/api/reports/daily-spending?month=${encodeURIComponent(selectedMonth)}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'failed');
      return j.data as { day: string; expense: number; income: number }[];
    },
    staleTime: 60_000,
  });

  return (
    <Panel className="p-4 w-full min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Chi tiết theo ngày ({selectedMonth})</h2>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Đang tải biểu đồ…</p>
      ) : (
        <ChartFrame height={288}>
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={q.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: any, n: any) => [fmtVND(Number(v)), n === 'expense' ? 'Chi' : 'Thu']} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="income"  stroke="#10b981" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>
      )}
    </Panel>
  );
}
