'use client';

import { useEffect, useState } from 'react';

type SharedReport = {
  id: string;
  title: string;
  created_at: string;
  expires_at: string | null;
  url: string;
  payload: any;
};

function fmtDateTime(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) {
    return { time: '', date: '' };
  }
  const time = d.toLocaleTimeString('vi-VN', { hour12: false });
  const date = d.toLocaleDateString('vi-VN');
  return { time, date };
}

export default function SharedReportsPage() {
  const [items, setItems] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/share', { cache: 'no-store', credentials: 'include' });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.message || 'Không tải được danh sách link chia sẻ');
      setItems(j.data as SharedReport[]);
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách link chia sẻ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 2000);
    return () => clearTimeout(t);
  }, [success]);

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess('Đã copy link vào clipboard');
    } catch {
      setError('Không copy được, hãy tự copy thủ công.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá link chia sẻ này?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/share/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j?.message || 'Xoá link thất bại');
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSuccess('Xoá link chia sẻ thành công');
    } catch (e: any) {
      setError(e?.message || 'Xoá link thất bại');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && items.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-6 space-y-4">
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-72 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </header>

        <section className="rounded-2xl border bg-white p-4 md:p-6 dark:bg-neutral-900 dark:border-neutral-800">
          {/* header table skeleton */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>

          {/* rows skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 dark:border-neutral-800"
              >
                {/* title + id */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>

                {/* created */}
                <div className="w-32 space-y-1">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>

                {/* expired */}
                <div className="w-32 space-y-1">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>

                {/* link */}
                <div className="w-56 h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />

                {/* actions */}
                <div className="w-[230px] flex justify-end gap-2">
                  <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Báo cáo đã chia sẻ</h1>
          <p className="text-sm text-gray-500">
            Quản lý các link báo cáo bạn đã tạo để chia sẻ công khai.
          </p>
        </div>
      </header>

      {/* Thông báo */}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
          Chưa có báo cáo nào được chia sẻ.
        </div>
      ) : (
        <section className="rounded-2xl border bg-white p-4 md:p-6 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4 text-left">Tiêu đề</th>
                  <th className="py-2 px-4 text-left">Tạo lúc</th>
                  <th className="py-2 px-4 text-left">Hết hạn</th>
                  <th className="py-2 px-4 text-left">Link</th>
                  <th className="py-2 pl-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const created = fmtDateTime(r.created_at);
                  const expired = r.expires_at ? fmtDateTime(r.expires_at) : null;

                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      {/* Tiêu đề + ID  */}
                      <td className="py-3 pr-4 align-top">
                        <div className="font-medium text-gray-900">{r.title}</div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                          <span>ID:</span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-mono">
                            {r.id}
                          </span>
                        </div>
                      </td>

                      {/* Tạo lúc */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-gray-700">
                        {created.time}
                        <div className="text-xs text-gray-500">{created.date}</div>
                      </td>

                      {/* Hết hạn */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-gray-700">
                        {expired ? (
                          <>
                            {expired.time}
                            <div className="text-xs text-gray-500">{expired.date}</div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Không</span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                          title={r.url}
                        >
                          {r.url}
                        </a>
                      </td>

                      <td className="py-3 pl-4 align-top text-right whitespace-nowrap w-[260px]">
                        <div className="flex flex-nowrap items-center justify-end gap-2">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                          >
                            Mở
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(r.url)}
                            className="px-2.5 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                          >
                            Copy link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="px-2.5 py-1 text-xs rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === r.id ? 'Đang xoá…' : 'Xoá'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
