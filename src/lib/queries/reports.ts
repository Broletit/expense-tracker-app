'use client';

import {
  useQuery,
  useMutation,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';

// Helper fetch chuẩn có kiểm tra .ok và content-type 
const jfetch = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(url, init);
  const ct = r.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const j = isJson ? await r.json() : null;
  if (!r.ok || (j && j.ok === false)) {
    throw new Error(j?.message || `Request failed: ${r.status}`);
  }
  return (j?.data ?? j) as T;
};

// Dashboard

export type Dashboard = {
  totalExpense: number;
  totalIncome: number;
  diff: number;
  maxExpense: number;
  recent: any[];
};

export function useDashboard(params?: {
  month?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.month) q.set('month', params.month);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.limit) q.set('limit', String(params.limit));

  return useQuery<Dashboard, Error>({
    queryKey: ['reports', 'dashboard', params],
    queryFn: () =>
      jfetch<Dashboard>(`/api/reports/dashboard${q.toString() ? `?${q}` : ''}`),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

// Monthly trends (thu/chi theo tháng)
export type MonthlyRow = { month: string; expense: number; income: number };

export function useMonthlyTrends(limit = 6) {
  return useQuery<MonthlyRow[], Error>({
    queryKey: ['reports', 'monthly-trends', { limit }],
    queryFn: () =>
      jfetch<MonthlyRow[]>(`/api/reports/monthly-trends?limit=${limit}`),
    staleTime: 60_000, // 1 phút
    gcTime: 5 * 60 * 1000,
  });
}

// Category breakdown (thu/chi theo danh mục)
export type CatRow = { id: number; name: string; expense: number; income: number };

export function useCategoryBreakdown() {
  return useQuery<CatRow[], Error>({
    queryKey: ['reports', 'category-breakdown'],
    queryFn: () => jfetch<CatRow[]>(`/api/reports/category-breakdown`),
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });
}

//  Daily spending (thu/chi theo ngày)
export type DailyRow = { day?: string; date?: string; expense: number; income: number };

export function useDailySpending(month?: string) {
  const q = new URLSearchParams();
  if (month) q.set('month', month);

  return useQuery<DailyRow[], Error>({
    queryKey: ['reports', 'daily-spending', month ?? 'current'],
    queryFn: () =>
      jfetch<DailyRow[]>(
        `/api/reports/daily-spending${q.toString() ? `?${q}` : ''}`,
      ),
    staleTime: 60_000, 
    gcTime: 5 * 60 * 1000,
  });
}

//SHARE (tạo link chia sẻ; danh sách; xoá)

export type SharePayload = {
  title: string;
  payload?: any; 
  expires_at?: string | null; 
};

export type ShareLink = { id: string; url: string };
export type SharedItem = ShareLink & {
  title?: string;
  created_at?: string;
  expires_at?: string | null;
  ownerId?: number;
};

// POST /api/reports/share (tạo link chia sẻ) 
export function useShareReport(
  options?: UseMutationOptions<ShareLink, Error, SharePayload>,
) {
  return useMutation<ShareLink, Error, SharePayload>({
    mutationKey: ['reports', 'share'],
    mutationFn: (payload) =>
      jfetch<ShareLink>('/api/reports/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ...options,
  });
}

// GET /api/share (liệt kê link share của user) 
export function useSharedReports(
  options?: UseQueryOptions<SharedItem[], Error>,
) {
  return useQuery<SharedItem[], Error>({
    queryKey: ['share', 'list'],
    queryFn: () => jfetch<SharedItem[]>('/api/share'),
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// DELETE /api/share/[id] 
export function useDeleteShare(
  options?: UseMutationOptions<{ ok: true }, Error, { id: string }>,
) {
  return useMutation<{ ok: true }, Error, { id: string }>({
    mutationKey: ['share', 'delete'],
    mutationFn: ({ id }) =>
      jfetch<{ ok: true }>(`/api/share/${id}`, { method: 'DELETE' }),
    ...options,
  });
}

//EXPORT (CSV/PDF/Excel)

export type ExportPayload = {
  format: 'csv' | 'pdf' | 'excel';
  month?: string;
  from?: string;
  to?: string;
  scope?: 'dashboard' | 'expenses' | 'categories' | 'budgets';
};

export type ExportResult = {
  url?: string;
  fileName?: string;
  base64?: string;
};

// POST /api/reports/export 
export function useExportReport(
  options?: UseMutationOptions<ExportResult, Error, ExportPayload>,
) {
  return useMutation<ExportResult, Error, ExportPayload>({
    mutationKey: ['reports', 'export'],
    mutationFn: (payload) =>
      jfetch<ExportResult>('/api/reports/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ...options,
  });
}
