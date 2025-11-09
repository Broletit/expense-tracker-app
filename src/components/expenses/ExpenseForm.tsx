'use client';
import React, { useMemo, useState } from 'react';

export type ExpenseFormValue = {
  id?: number;
  category_id: number;
  amount: number | string;
  note?: string;
  spent_at: string;  
  kind?: 'expense' | 'income';
};

export default function ExpenseForm({
  initial,
  submitText = 'Lưu',
  onSubmit,
  cats = [],
  loading = false, 
}: {
  initial?: Partial<ExpenseFormValue>;
  submitText?: string;
  onSubmit: (v: ExpenseFormValue) => void;
  cats?: { id: number; name: string }[];
  loading?: boolean;
}) {
  const [form, setForm] = useState<ExpenseFormValue>({
    category_id: initial?.category_id ?? 0,
    amount: initial?.amount ?? '',
    note: initial?.note ?? '',
    spent_at: initial?.spent_at ?? new Date().toISOString().slice(0, 10),
    kind: (initial?.kind as any) ?? 'expense',
  });
  const [errors, setErrors] = useState<{category_id?: string; amount?: string}>({});
  const validAmount = useMemo(() => {
    const n = Number(form.amount);
    return Number.isFinite(n) && n >= 1;
  }, [form.amount]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErr: typeof errors = {};
    if (!form.category_id || form.category_id <= 0) nextErr.category_id = 'Hãy chọn danh mục';
    if (!validAmount) nextErr.amount = 'Số tiền phải là số dương (≥ 1)';
    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;
    onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {/* Chi / Thu */}
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            checked={form.kind === 'expense'}
            onChange={() => setForm({ ...form, kind: 'expense' })}
          />
          <span>Chi</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            checked={form.kind === 'income'}
            onChange={() => setForm({ ...form, kind: 'income' })}
          />
          <span>Thu</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Danh mục</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.category_id ? 'border-rose-400' : ''}`}
          >
            <option value={0}>— Chọn danh mục —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-rose-600">{errors.category_id}</p>}
        </div>

        {/* Ngày */}
        <div>
          <label className="text-sm text-gray-600">Ngày</label>
          <input
            type="date"
            value={form.spent_at}
            onChange={(e) => setForm({ ...form, spent_at: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      {/* Số tiền */}
      <div>
        <label className="text-sm text-gray-600">Số tiền</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step="any"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}  // tránh cuộn thay đổi số
          onKeyDown={(e) => { if (['e','E','+','-'].includes(e.key)) e.preventDefault(); }}
          className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.amount ? 'border-rose-400' : ''}`}
          placeholder="Nhập số tiền"
        />
        <p className="mt-1 text-xs text-gray-500">Chỉ nhập số, tối thiểu 1 (đ).</p>
        {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>}
      </div>

      {/* Ghi chú */}
      <div>
        <label className="text-sm text-gray-600">Ghi chú</label>
        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Ví dụ: Xem phim, tiền điện…"
        />
      </div>

      <div className="pt-2">
        <button
          disabled={loading}
          className={'rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700'}
        >
          {loading ? 'Đang lưu…' : submitText}
        </button>
      </div>
    </form>
  );
}
