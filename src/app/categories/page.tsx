'use client';

import { useState } from 'react';
import {
  Category,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from '@/lib/queries/categories';
import CategoryForm, { CategoryFormValue } from '@/components/categories/CategoryForm';
import CategoriesTable from '@/components/categories/CategoriesTable';
import CategoryDialog from '@/components/categories/CategoryDialog';
import { useQuery } from '@tanstack/react-query';
import CategoriesFiltersBar from '@/components/categories/CategoriesFilterBar';
import CategoriesPagination from '@/components/categories/CategoriesPagination';

async function fetchCategoriesPaged(params: {
  q?: string;
  inuse?: '' | '1' | '0';
  sort?: string;
  page: number;
  limit: number;
}) {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.inuse) p.set('inuse', params.inuse);
  if (params.sort) p.set('sort', params.sort);
  p.set('page', String(params.page));
  p.set('limit', String(params.limit));
  const res = await fetch(`/api/categories?${p.toString()}`, { cache: 'no-store' });
  const j = await res.json();
  if (!res.ok || j?.ok === false) throw new Error(j?.message || `HTTP ${res.status}`);
  return {
    items: j.items as Category[],
    meta: j.meta as { page: number; limit: number; total: number; pages: number },
  };
}

export default function CategoriesPage() {
  //lọc + phân trang 
  const [q, setQ] = useState('');
  const [inuse, setInuse] = useState<'' | '1' | '0'>('');
  const [sort, setSort] = useState('sort_order:asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data,
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['categories', 'paged', { q, inuse, sort, page, limit }],
    queryFn: () => fetchCategoriesPaged({ q, inuse, sort, page, limit }),
    staleTime: 10_000,
  });

  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  //CHỌN NHIỀU 
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll(checked: boolean) {
    if (!rows.length) return;
    setSelected(checked ? rows.map((r) => r.id) : []);
  }

  //KÉO-THẢ THỨ TỰ 
  const [dragIds, setDragIds] = useState<number[] | null>(null);
  const reorder = useReorderCategories();

  function onDragStart(e: React.DragEvent<HTMLTableRowElement>, id: number) {
    e.dataTransfer.setData('text/plain', String(id));
    setDragIds((ids) => ids ?? rows.map((r) => r.id));
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(
    e: React.DragEvent<HTMLTableSectionElement | HTMLTableRowElement>,
    targetId?: number
  ) {
    e.preventDefault();
    const srcId = Number(e.dataTransfer.getData('text/plain'));
    if (!srcId || !dragIds) return;
    if (targetId == null || srcId === targetId) return;
    const next = [...dragIds];
    const from = next.indexOf(srcId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, srcId);
    setDragIds(next);
  }
  function onToggleReorder() {
    setDragIds((d) => (d ? null : rows.map((r) => r.id)));
  }
  function commitReorder() {
    if (!dragIds) return;
    reorder.mutate(dragIds, {
      onSuccess: () => {
        setDragIds(null);
        refetch();
      },
    });
  }

  // CRUD 
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  function submitCreate(v: CategoryFormValue) {
    create.mutate(v as any, {
      onSuccess: () => {
        setAdding(false);
        refetch();
      },
      onError: (e: any) => {
        alert(e?.message || 'Tạo danh mục thất bại');
      },
    });
  }

  function submitEdit(v: CategoryFormValue) {
    if (!editing) return;
    update.mutate(
      { id: editing.id, data: v as any },
      {
        onSuccess: () => {
          setEditing(null);
          refetch();
        },
        onError: (err: any) => {
          if (
            String(err?.message || '').toLowerCase().includes('tồn tại') ||
            String(err?.code || '') === 'DUPLICATE'
          ) {
            alert('Danh mục đã tồn tại. Vui lòng chọn tên khác.');
          } else {
            alert(err?.message || 'Cập nhật thất bại');
          }
        },
      }
    );
  }

  function askDelete(c: Category) {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
    remove.mutate(c.id, {
      onSuccess: () => {
      },
      onError: (err: any) => {
        const msg = err?.message || '';
        if (err?.code === 'HAS_DEPENDENCIES' || /kho.+ th.+ xo.+/i.test(msg)) {
          alert('Không thể xóa: danh mục đang được sử dụng trong giao dịch.');
        } else {
          alert(msg || 'Xóa thất bại');
        }
      },
    });
  }

  function askBulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Xoá ${selected.length} danh mục đã chọn?`)) return;
    (async () => {
      for (const id of selected) {
        await remove.mutateAsync(id).catch(() => {
        });
      }
      setSelected([]);
      refetch();
    })();
  }

  // SKELETON lần đầu
  const firstLoading = isLoading && !data;

  if (firstLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton cho thanh filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-9 w-full max-w-xl rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        {/* Skeleton cho bảng */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
          <div className="w-full border-t border-gray-200 dark:border-neutral-800" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-neutral-800"
            >
              <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="w-24 h-7 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton pagination */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-8 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thanh filter + nút thêm/bulk delete/reorder */}
      <CategoriesFiltersBar
        q={q}
        setQ={(s) => {
          setQ(s);
          setPage(1);
        }}
        sort={sort}
        setSort={(s) => {
          setSort(s);
          setPage(1);
        }}
        inuse={inuse}
        setInuse={(s) => {
          setInuse(s);
          setPage(1);
        }}
        onAdd={() => setAdding(true)}
        selectedCount={selected.length}
        onBulkDelete={askBulkDelete}
        reordering={!!dragIds}
        onToggleReorder={onToggleReorder}
        onSaveOrder={commitReorder}
        savingOrder={reorder.isPending}
      />

      {/* Indicator đang refetch (giữ dữ liệu cũ) */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>Đang cập nhật danh sách…</span>
        </div>
      )}

      <CategoriesTable
        rows={dragIds ? dragIds.map((id) => rows.find((r) => r.id === id)!).filter(Boolean) : rows}
        dragIds={dragIds}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onEdit={(c) => setEditing(c)}
        onDelete={askDelete}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

      <CategoriesPagination
        total={total}
        page={page}
        pageSize={limit}
        onPage={(p) => setPage(p)}
        onLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />

      {adding && (
        <CategoryDialog title="Thêm danh mục" onClose={() => setAdding(false)}>
          <CategoryForm
            submitText="Tạo danh mục"
            onSubmit={(v) => {
              if (!v.name || !v.name.trim()) return alert('Tên danh mục không được để trống');
              submitCreate({ ...v, name: v.name.trim() });
            }}
          />
        </CategoryDialog>
      )}

      {editing && (
        <CategoryDialog title="Sửa danh mục" onClose={() => setEditing(null)}>
          <CategoryForm
            key={editing.id}
            initial={{ name: editing.name, icon: editing.icon, color: editing.color }}
            submitText="Cập nhật"
            onSubmit={(v) => {
              if (!v.name || !v.name.trim()) return alert('Tên danh mục không được để trống');
              submitEdit({ ...v, name: v.name.trim() });
            }}
          />
        </CategoryDialog>
      )}
    </div>
  );
}
