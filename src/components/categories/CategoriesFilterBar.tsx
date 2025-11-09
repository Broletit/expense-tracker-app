'use client';
import React from 'react';

type Props = {
  q: string; setQ: (s: string) => void;
  sort: string; setSort: (s: string) => void;
  inuse: '' | '1' | '0'; setInuse: (s: ''|'1'|'0') => void;
  onAdd: () => void;
  selectedCount: number; onBulkDelete: () => void;
  reordering: boolean; onToggleReorder: () => void;
  onSaveOrder: () => void; savingOrder?: boolean;
};

export default function CategoriesFiltersBar({
  q, setQ, sort, setSort, inuse, setInuse,
  onAdd, selectedCount, onBulkDelete,
  reordering, onToggleReorder, onSaveOrder, savingOrder
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-3 md:p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Tìm tên danh mục…"
            className="w-48 md:w-56 rounded-lg border px-3 py-2"
          />
          <select
            value={sort}
            onChange={(e)=>setSort(e.target.value)}
            className="rounded-lg border px-2 py-2"
          >
            <option value="sort_order:asc">Thứ tự</option>
            <option value="name:asc">Tên (A→Z)</option>
            <option value="name:desc">Tên (Z→A)</option>
            <option value="usage:desc">Đang dùng nhiều</option>
          </select>
          <select
            value={inuse}
            onChange={(e)=>setInuse(e.target.value as ''|'1'|'0')}
            className="rounded-lg border px-2 py-2"
          >
            <option value="">Tất cả</option>
            <option value="1">Đang được dùng</option>
            <option value="0">Chưa được dùng</option>
          </select>

          <button
            onClick={onToggleReorder}
            className={`rounded-lg border px-3 py-2 text-sm ${reordering ? 'bg-amber-50 border-amber-400 text-amber-700' : 'hover:bg-gray-50'}`}
          >
            {reordering ? 'Đang sắp xếp' : 'Sắp xếp'}
          </button>
          {reordering && (
            <button
              onClick={onSaveOrder}
              disabled={savingOrder}
              className="rounded-lg px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Lưu thứ tự
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={onBulkDelete}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-rose-50 border-rose-400 text-rose-600"
            >
              Xoá {selectedCount} mục
            </button>
          )}
          <button
            onClick={onAdd}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            + Thêm danh mục
          </button>
        </div>
      </div>
    </div>
  );
}
