'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export type Category = {
  id: number;
  name: string;
  icon?: string;        
  color?: string;       
  sort_order: number;
  usage_count?: number; 
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const r = await fetch('/api/categories');
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'Fetch categories failed');
      return j.data as Category[];
    },
    placeholderData: keepPreviousData,
    // 10 phút (ít thay đổi)
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Category>) => {
      const r = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'Create category failed');
      return j.data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories', 'list'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const r = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'Update category failed');
      return j.data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'list'] });
    },
  });
}

async function parseJSONSafe(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await parseJSONSafe(res);
        const err: any = new Error(
          (data?.message as string) ||
            (res.status === 405
              ? 'Phương thức không được phép (405). Kiểm tra route DELETE /api/categories/[id].'
              : res.status === 409
              ? 'Xung đột dữ liệu (409).'
              : `HTTP ${res.status}`)
        );
        err.code =
          (data?.code as string | undefined) ||
          (res.status === 405
            ? 'METHOD_NOT_ALLOWED'
            : res.status === 409
            ? 'CONFLICT'
            : undefined);
        err.count = data?.count as number | undefined;
        throw err;
      }

      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'list'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();

  return useMutation({
    // API: POST /api/categories/reorder  with body { ids: number[] }
    mutationFn: async (ids: number[]) => {
      const r = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || 'Reorder failed');
      return j.data;
    },

    // Optimistic update + rollback
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['categories', 'list'] });
      const prev = qc.getQueryData<Category[]>(['categories', 'list']);
      if (prev) {
        const map = new Map<number, Category>();
        prev.forEach((c) => map.set(c.id, c));
        const next = ids.map((id, i) => ({ ...map.get(id)!, sort_order: i + 1 }));
        qc.setQueryData(['categories', 'list'], next);
      }
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['categories', 'list'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
