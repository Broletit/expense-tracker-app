'use client';

import { useEffect, useState, useCallback } from 'react';
import EmojiButton from '@/components/common/EmojiButton';

export type CategoryFormValue = { name: string; icon?: string; color?: string; };

export default function CategoryForm({
  initial,
  onSubmit,
  submitText = 'Lưu',
}: {
  initial?: Partial<CategoryFormValue>;
  onSubmit: (v: CategoryFormValue) => void;
  submitText?: string;
}) {
  const [v, setV] = useState<CategoryFormValue>({
    name: '',
    icon: '📁',
    color: '#3b82f6',
    ...initial,
  });
  const [err, setErr] = useState<string>('');   

  useEffect(() => {
    if (initial) setV((x) => ({ ...x, ...initial }));
  }, [initial]);

  const handleSubmit = useCallback((e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const name = (v.name ?? '').trim();
    if (!name) {
      setErr('Vui lòng nhập tên danh mục');
      return;
    }
    setErr('');
    onSubmit({ ...v, name });
  }, [v, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tên danh mục */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-500">Tên danh mục</span>
        <input
          className={`border rounded px-3 py-2 bg-white dark:bg-gray-950 ${err ? 'border-rose-400' : ''}`}
          value={v.name}
          onChange={(e) => { setV((x) => ({ ...x, name: e.target.value })); if (err) setErr(''); }}
          required
          placeholder="Ví dụ: Giải trí"
        />
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </label>

      {/* Biểu tượng */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-500">Biểu tượng</span>
        <div className="flex justify-start">
          <EmojiButton value={v.icon} onChange={(val) => setV((x) => ({ ...x, icon: val }))} />
        </div>
      </label>

      {/* Màu */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-500">Màu hiển thị</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="h-10 w-16 p-0 border rounded bg-transparent"
            value={v.color ?? '#3b82f6'}
            onChange={(e) => setV((x) => ({ ...x, color: e.target.value }))}
          />
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm"
            style={{ background: `${v.color}20`, borderColor: `${v.color}55` }}
          >
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: v.color }} />
            {v.name || 'Danh mục'}
          </span>
        </div>
      </label>

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
}
