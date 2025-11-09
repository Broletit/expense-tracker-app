'use client';

import React from 'react';
import { ExpenseParams } from '@/lib/queries/expenses';

type Props = {
  params: ExpenseParams & { kind?: 'expense' | 'income' };
  setParams: (u: any) => void;
  q: string;
  setQ: (s: string) => void;
  range: { from?: string; to?: string };
  setRange: (r: { from?: string; to?: string }) => void;
  cats: Array<{ id: number; name: string }>;
  selectedCount: number;
  onBulkDelete: () => void;
  onAdd: () => void;
};

export default function ExpensesFiltersBar({
  params,
  setParams,
  q,
  setQ,
  range,
  setRange,
  cats,
  selectedCount,
  onBulkDelete,
  onAdd,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm flex flex-wrap items-center gap-2">
      {/* Search */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm kiếm theo ghi chú..."
        className="w-40 sm:w-52 rounded-lg border px-3 py-2 text-sm"
      />

      {/* Sort */}
      <select
        value={params.sort ?? 'date:desc'}
        onChange={(e) => setParams((old: any) => ({ ...old, sort: e.target.value }))}
        className="rounded-lg border px-2 py-2 text-sm"
      >
        <option value="date:desc">Mới nhất</option>
        <option value="date:asc">Cũ nhất</option>
        <option value="amount:desc">Số tiền ↓</option>
        <option value="amount:asc">Số tiền ↑</option>
      </select>

      {/* Danh mục */}
      <select
        value={params.category_id ?? ''}
        onChange={(e) =>
          setParams((old: any) => ({
            ...old,
            page: 1,
            category_id: e.target.value ? Number(e.target.value) : undefined,
          }))
        }
        className="rounded-lg border px-2 py-2 text-sm"
      >
        <option value="">Tất cả danh mục</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Thu / Chi */}
      <select
        value={(params as any).kind ?? ''}
        onChange={(e) =>
          setParams((old: any) => ({
            ...old,
            page: 1,
            kind: (e.target.value || undefined) as 'expense' | 'income' | undefined,
          }))
        }
        className="rounded-lg border px-2 py-2 text-sm"
      >
        <option value="">Tất cả</option>
        <option value="expense">Chi</option>
        <option value="income">Thu</option>
      </select>

      {/* Ngày từ / đến */}
      <input
        type="date"
        value={range.from ?? ''}
        onChange={(e) => setRange({ ...range, from: e.target.value || undefined })}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      <input
        type="date"
        value={range.to ?? ''}
        onChange={(e) => setRange({ ...range, to: e.target.value || undefined })}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      {Boolean(range.from || range.to) && (
        <button
          onClick={() => setRange({})}
          className="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
          title="Bỏ lọc ngày"
        >
          ✖
        </button>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {selectedCount > 0 && (
          <button
            onClick={onBulkDelete}
            className="rounded-lg border px-3 py-2 text-sm border-rose-400 text-rose-600 hover:bg-rose-50"
          >
            Xóa {selectedCount} mục
          </button>
        )}
        <button
          onClick={onAdd}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
        >
          + Thêm khoản
        </button>
      </div>
    </div>
  );
}
