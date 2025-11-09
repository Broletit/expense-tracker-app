'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
  '#22c55e',
  '#a855f7',
];

const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

//MONTHLY BAR 
export function MonthlyBar({
  monthly,
}: {
  monthly: { month: string; expense?: number; income?: number }[];
}) {
  const data = (monthly || []).map((r) => ({
    month: r.month,
    expense: Number(r.expense || 0),
    income: Number(r.income || 0),
  }));
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.toLocaleString('vi-VN')}
          />
          <Tooltip
            formatter={(value: any, _name: any, item: any) => {
              const label = item?.dataKey === 'income' ? 'Thu' : 'Chi';
              return [fmtVND(Number(value)), label];
            }}
            labelFormatter={(l) => `Tháng ${l}`}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Thu"
            radius={[6, 6, 0, 0]}
            fill="#10b981"
          />
          <Bar
            dataKey="expense"
            name="Chi"
            radius={[6, 6, 0, 0]}
            fill="#ef4444"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

//CATEGORY PIE: 
export function CategoryPie({
  categories,
}: {
  categories: { name: string; expense?: number; income?: number }[];
}) {
  const colorByName = new Map<string, string>();
  let colorIdx = 0;

  function getColor(name: string) {
    if (!colorByName.has(name)) {
      colorByName.set(name, COLORS[colorIdx % COLORS.length]);
      colorIdx += 1;
    }
    return colorByName.get(name)!;
  }

  const expData = categories
    .map((c) => ({
      name: c.name || 'Khác',
      value: Number(c.expense || 0),
      kind: 'Chi' as const,
    }))
    .filter((d) => d.value > 0);

  const incData = categories
    .map((c) => ({
      name: c.name || 'Khác',
      value: Number(c.income || 0),
      kind: 'Thu' as const,
    }))
    .filter((d) => d.value > 0);

  const totalExpense = expData.reduce((s, d) => s + d.value, 0);
  const totalIncome = incData.reduce((s, d) => s + d.value, 0);

  // Gán màu cố định theo tên
  expData.forEach((d) => getColor(d.name));
  incData.forEach((d) => getColor(d.name));

  const legendItems = Array.from(colorByName.entries()).map(
    ([name, color]) => ({ name, color })
  );

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Vòng TRÁI: Thu */}
          <Pie
            data={incData}
            dataKey="value"
            nameKey="name"
            cx="30%"
            cy="50%"
            outerRadius={80}
            innerRadius={50}
            paddingAngle={2}
            label={false}
            labelLine={false}
          >
            {incData.map((d, i) => (
              <Cell
                key={`inc-${i}`}
                fill={getColor(d.name)}
              />
            ))}
          </Pie>

          {/* Vòng PHẢI: Chi */}
          <Pie
            data={expData}
            dataKey="value"
            nameKey="name"
            cx="70%"
            cy="50%"
            outerRadius={80}
            innerRadius={50}
            paddingAngle={2}
            label={false}
            labelLine={false}
          >
            {expData.map((d, i) => (
              <Cell
                key={`exp-${i}`}
                fill={getColor(d.name)}
              />
            ))}
          </Pie>

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const p: any = payload[0];
              const { name, value, kind } = p.payload as {
                name: string;
                value: number;
                kind: 'Thu' | 'Chi';
              };
              const total =
                kind === 'Thu' ? totalIncome || 1 : totalExpense || 1;
              const pct = (value / total) * 100;

              const colorClass =
                kind === 'Thu' ? 'text-emerald-600' : 'text-rose-600';

              return (
                <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
                  <div className="font-medium mb-1">{name}</div>
                  <div className={colorClass}>
                    {kind} : {fmtVND(value)} • {pct.toFixed(1)}%
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
        {legendItems.map((it) => (
          <span key={it.name} className="inline-flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            <span>{it.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

//DAILY LINE 
export function DailyLine({
  daily,
}: {
  daily: { day?: string; date?: string; expense: number; income: number }[];
}) {
  const data = (daily || []).map((d) => ({
    day: (d.day || d.date || '').slice(5),
    expense: Number(d.expense || 0),
    income: Number(d.income || 0),
  }));

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.toLocaleString('vi-VN')}
          />
          <Tooltip
            formatter={(value: any, _name: any, item: any) => {
              const label = item?.dataKey === 'income' ? 'Thu' : 'Chi';
              return [fmtVND(Number(value)), label];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="expense"
            name="Chi"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Thu"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// TINY TREND 
export function TinyTrend({
  data,
  dataKey,
  height = 60,
  label,
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  height?: number;
  label?: string;
}) {
  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="__x" hide />
            <YAxis hide />
            <Tooltip
              formatter={(v: any) => v?.toLocaleString?.('vi-VN')}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#3b82f6"
              fillOpacity={1}
              fill={`url(#grad-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// WEEKDAY BAR
export function WeekdayBar({
  weekly,
  label = 'Theo thứ trong tuần',
}: {
  weekly: Array<{ name: string; expense: number; income: number }>;
  label?: string;
}) {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weekly}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.toLocaleString('vi-VN')}
          />
          <Tooltip
            formatter={(value: any, _name: any, item: any) => {
              const label = item?.dataKey === 'income' ? 'Thu' : 'Chi';
              return [`${fmtVND(Number(value))}`, label];
            }}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Thu"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Chi"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
