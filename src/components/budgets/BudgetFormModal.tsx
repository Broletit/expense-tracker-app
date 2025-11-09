'use client';

import { useState } from 'react';

type Props = {
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (data: { categoryId: number; limit_amount: number; note?: string | null }) => void;
  defaultValue: { id: number; categoryId: number; period: string; limit_amount: number; note: string | null };
  categories: { id: number; name: string; icon?: string; color?: string }[];
};

export default function BudgetFormModal({ mode, onClose, onSubmit, defaultValue, categories }: Props) {
  const [categoryId, setCategoryId] = useState<number>(defaultValue.categoryId);
  const [limitAmount, setLimitAmount] = useState<number>(defaultValue.limit_amount);
  const [note, setNote] = useState<string>(defaultValue.note ?? '');

  const submit = () => {
    if (!categoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (limitAmount == null || isNaN(limitAmount) || limitAmount < 0) {
      alert('Hạn mức phải là số >= 0');
      return;
    }
    onSubmit({ categoryId, limit_amount: limitAmount, note });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border p-5 space-y-4">
        <div className="text-lg font-semibold">{mode === 'create' ? 'Thêm ngân sách' : 'Sửa ngân sách'}</div>

        <div className="space-y-2">
          <label className="text-sm">Danh mục</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? '📁'} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Hạn mức</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
            value={limitAmount}
            onChange={(e) => setLimitAmount(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Ghi chú</label>
          <input
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tuỳ chọn…"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:text-black">
            {mode === 'create' ? 'Thêm' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
