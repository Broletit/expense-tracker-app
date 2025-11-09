'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';                      
import { useShareReport } from '@/lib/queries/reports';

type Snapshot = {
  generatedAt: string;
  monthly: any[];
  categories: any[];
  daily: any[];
};

type Props = {
  buildSnapshot: () => Promise<Snapshot>;
};

export default function SharePopover({ buildSnapshot }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    () => `Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [expiresAt, setExpiresAt] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  const popRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const share = useShareReport();

  // Ẩn popover khi click ngoài hoặc nhấn Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  async function createLink() {
    try {
      setLoading(true);
      const snap = await buildSnapshot();
      const iso = expiresAt ? new Date(expiresAt).toISOString() : null;
      const result = await share.mutateAsync({
        title: title.trim() || 'Shared report',
        payload: snap,
        expires_at: iso,
      });

      const fullLink = result.url || `${window.location.origin}/share/${result.id}`;
      setLink(fullLink);
      try {
        await navigator.clipboard.writeText(fullLink);
      } catch {}
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo link chia sẻ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded border bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700"
      >
        Chia sẻ
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-2 w-[320px] rounded-lg border bg-white shadow-lg p-4 z-50 dark:bg-zinc-800 dark:border-zinc-700 space-y-3"
        >
          {!link ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Tiêu đề
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm dark:bg-zinc-900 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Hạn dùng (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm dark:bg-zinc-900 dark:border-zinc-700"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Để trống nếu muốn tồn tại vĩnh viễn.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-2.5 py-1 text-sm rounded border bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  Đóng
                </button>
                <button
                  onClick={createLink}
                  disabled={loading}
                  className="px-2.5 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Đang tạo…' : 'Tạo link'}
                </button>
              </div>

              <div className="pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Quản lý các báo cáo đã chia sẻ
                </span>
                <Link
                  href="/share"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Xem tất cả
                </Link>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Public link
                </label>
                <input
                  readOnly
                  value={link}
                  className="w-full rounded border px-2 py-1 text-sm bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-sm rounded border bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  Mở
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="px-2.5 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Copy
                </button>
              </div>

              <div className="pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Quản lý các báo cáo đã chia sẻ
                </span>
                <Link
                  href="/share"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Xem tất cả
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
