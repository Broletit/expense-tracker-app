'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type BudgetItemAPI = {
  id: number;
  categoryId: number;
  period: string;
  limit_amount: number;
  note: string | null;
};

export type ProgressItemAPI = {
  id: number;
  user_id: number;
  category_id: number;
  period: string;
  limit_amount: number;
  note: string | null;
  income_actual: number;
  expense_actual: number;
  over_budget: 0 | 1;
};

export function useBudgets(period: string) {
  return useQuery({
    queryKey: ['budgets', period],
    queryFn: async () => {
      const r = await fetch(`/api/budgets?period=${period}`);
      if (!r.ok) throw new Error('Failed to load budgets');
      return (await r.json()) as { items: BudgetItemAPI[] };
    },
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useBudgetProgress(period: string) {
  return useQuery({
    queryKey: ['budget-progress', period],
    queryFn: async () => {
      const r = await fetch(`/api/budgets/progress?period=${period}`);
      if (!r.ok) throw new Error('Failed to load budget progress');
      return (await r.json()) as {
        items: ProgressItemAPI[];
        summary: {
          limit: number;
          income: number;
          expense: number;
          progress: number;
          over: boolean;
          used: number;
          remain: number;
        };
      };
    },
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });
}

type CreateBody = {
  categoryId: number;
  period: string;
  limit_amount: number;
  note?: string | null;
};

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateBody) => {
      const r = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-progress'] });
      qc.invalidateQueries({ queryKey: ['budget-search'] });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & Partial<CreateBody>) => {
      const r = await fetch(`/api/budgets?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-progress'] });
      qc.invalidateQueries({ queryKey: ['budget-search'] });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-progress'] });
      qc.invalidateQueries({ queryKey: ['budget-search'] });
    },
  });
}

/** SEARCH + FILTER + PAGINATION */
export function useBudgetSearch(params: {
  period: string;
  q?: string;
  categoryId?: number;
  status?: 'all' | 'over' | 'under';
  page?: number;
  limit?: number;
}) {
  const {
    period,
    q = '',
    categoryId = 0,
    status = 'all',
    page = 1,
    limit = 10,
  } = params;
  const qs = new URLSearchParams({
    period,
    q,
    status,
    page: String(page),
    limit: String(limit),
  });
  if (categoryId) qs.set('categoryId', String(categoryId));

  return useQuery({
    queryKey: ['budget-search', period, q, categoryId, status, page, limit],
    queryFn: async () => {
      const r = await fetch(`/api/budgets/search?${qs.toString()}`);
      if (!r.ok) throw new Error('Failed to search budgets');
      return (await r.json()) as {
        items: (ProgressItemAPI & { cat_name: string; cat_icon: string | null })[];
        meta: { page: number; limit: number; total: number; pages: number };
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });
}

/** COPY BUDGETS between months */
export function useCopyBudgets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fromPeriod: string;
      toPeriod: string;
      overwrite?: boolean;
    }) => {
      const r = await fetch('/api/budgets/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ copied: number }>;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['budgets', vars.toPeriod] });
      qc.invalidateQueries({ queryKey: ['budget-progress', vars.toPeriod] });
      qc.invalidateQueries({ queryKey: ['budget-search', vars.toPeriod] });
    },
  });
}
