'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

//Types 
export type ExpenseParams = {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  from?: string;
  to?: string;
  kind?: 'expense' | 'income';
  category_id?: number;
};

export type ExpenseItem = {
  id: number;
  date: string; 
  kind: 'expense' | 'income';
  amount: number;
  description?: string | null;
  category_id?: number | null;
  categoryName?: string | null;
  icon?: string | null;
  color?: string | null;
};

export type ExpenseListResponse = {
  items: ExpenseItem[];
  data?: ExpenseItem[]; 
  rows?: ExpenseItem[]; 
  total: number;
  count?: number; 
  page: number;
  limit: number;
};

export type ExpenseStatsResponse = {
  totalExpense: number;
  totalIncome: number;
  diff: number;
  maxExpense: number;
};

// Utils
function qs(obj: Record<string, any>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  return p.toString();
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  }
  return data as T;
}

//Queries 
export function useExpensesList(params: ExpenseParams) {
  return useQuery({
    queryKey: ['expenses', 'list', params],
    queryFn: async () => {
      const query = qs(params);
      const json = await fetchJSON<ExpenseListResponse>(`/api/expenses?${query}`);
      const items = json.items ?? json.data ?? json.rows ?? [];
      const total = json.total ?? json.count ?? 0;
      return {
        ...json,
        items,
        total,
        page: json.page ?? params.page ?? 1,
        pageSize: json.limit ?? params.limit ?? 10,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useExpenseStats(params?: Partial<ExpenseParams>) {
  return useQuery({
    queryKey: ['expenses', 'stats', params || {}],
    queryFn: async () => {
      const query = qs(params || {});
      return await fetchJSON<ExpenseStatsResponse>(`/api/expenses/stats?${query}`);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await fetchJSON(`/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', 'list'] });
      qc.invalidateQueries({ queryKey: ['expenses', 'stats'] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await fetchJSON(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', 'list'] });
      qc.invalidateQueries({ queryKey: ['expenses', 'stats'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await fetchJSON(`/api/expenses/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', 'list'] });
      qc.invalidateQueries({ queryKey: ['expenses', 'stats'] });
    },
  });
}

export function useBulkDeleteExpenses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      return await fetchJSON(`/api/expenses/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', 'list'] });
      qc.invalidateQueries({ queryKey: ['expenses', 'stats'] });
    },
  });
}
