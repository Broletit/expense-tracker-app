'use client';

import { useMemo, useState } from 'react';
import {
  useBudgets,
  useBudgetProgress,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useBudgetSearch,
  useCopyBudgets,
  BudgetItemAPI,
  ProgressItemAPI,
} from '@/lib/queries/budgets';
import { useQuery } from '@tanstack/react-query';
import BudgetFormModal from '@/components/budgets/BudgetFormModal';
import BudgetProgressGrid from '@/components/budgets/BudgetProgressGrid';
import BudgetFilterBar from '@/components/budgets/BudgetFilterBar';
import BudgetTable from '@/components/budgets/BudgetTable';
import BudgetCopyModal from '@/components/budgets/BudgetCopyModal';

function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories');
      if (!r.ok) throw new Error('Failed to load categories');
      const j = await r.json();
      return (j.items ?? j.data) as { id: number; name: string; icon?: string; color?: string }[];
    },
  });
}

const getMonth = () => new Date().toISOString().slice(0, 7);

export default function BudgetsPage() {
  const [period, setPeriod] = useState<string>(getMonth());

  //  QUERIES CHÍNH 
  const {
    data: progress,
    isLoading: loadingProgress,
    isFetching: fetchingProgress,
  } = useBudgetProgress(period);

  const {
    data: categories,
    isLoading: loadingCategories,
  } = useCategories();

  const {
    data: budgetList,
    isLoading: loadingBudgets,
  } = useBudgets(period);

  const create = useCreateBudget();
  const update = useUpdateBudget();
  const del = useDeleteBudget();
  const copy = useCopyBudgets();

  // filter state
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState(0);
  const [status, setStatus] = useState<'all' | 'over' | 'under'>('all');

  // table pagination (server)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const search = useBudgetSearch({ period, q, categoryId, status, page, limit });

  // grid pagination (client) 
  const [cardPage, setCardPage] = useState(1);
  const [cardLimit, setCardLimit] = useState(3);

  const catName = (id: number) => categories?.find((c) => c.id === id)?.name ?? `#${id}`;

  const header = useMemo(() => {
    const s = (progress?.summary ?? {}) as any;
    return {
      limit_total: Number(s.limit_total ?? 0),
      income_total: Number(s.income_total ?? 0),
      expense_total: Number(s.expense_total ?? 0),
      used: Math.max(0, Number(s.expense_total ?? 0) - Number(s.income_total ?? 0)),
    };
  }, [progress]);

  const remain = Math.max(0, header.limit_total - header.used);
  const overallProgress =
    header.limit_total > 0 ? Math.min(1, header.used / header.limit_total) : 0;
  const over = header.used > header.limit_total;

  const existsBudgetCategory = (catId: number) =>
    !!(budgetList?.items ?? []).find((b) => b.categoryId === catId && b.period === period);

  // CREATE / UPDATE / DELETE / COPY
  const [openForm, setOpenForm] =
    useState<null | { mode: 'create' | 'edit'; data?: BudgetItemAPI }>(null);
  const [openCopy, setOpenCopy] = useState(false);

  const onCreate = async (data: {
    categoryId: number;
    limit_amount: number;
    note?: string | null;
  }) => {
    if (existsBudgetCategory(data.categoryId)) {
      alert('Danh mục này đã tồn tại trong ngân sách tháng này. Vui lòng chọn danh mục khác.');
      return;
    }
    await create.mutateAsync({ ...data, period });
    setOpenForm(null);
    setPage(1);
    setCardPage(1);
  };

  const onUpdate = async (
    id: number,
    data: Partial<{ categoryId: number; limit_amount: number; note?: string | null }>
  ) => {
    if (typeof data.categoryId !== 'undefined') {
      const current = (budgetList?.items ?? []).find((b) => b.id === id);
      if (current && data.categoryId !== current.categoryId && existsBudgetCategory(data.categoryId)) {
        alert('Danh mục này đã tồn tại trong ngân sách tháng này. Vui lòng chọn danh mục khác.');
        return;
      }
    }
    await update.mutateAsync({ id, ...data });
    setOpenForm(null);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Xác nhận xoá ngân sách này?')) return;
    await del.mutateAsync(id);
  };

  const onCopy = async (body: { fromPeriod: string; toPeriod: string; overwrite: boolean }) => {
    await copy.mutateAsync(body);
    setOpenCopy(false);
  };

  // Grid filter + paginate client
  const gridFiltered = useMemo(() => {
    let arr = (progress?.items ?? []) as ProgressItemAPI[];
    if (categoryId) arr = arr.filter((x) => x.category_id === categoryId);
    if (status !== 'all') {
      arr = arr.filter((x) => {
        const used = Math.max(0, (x.expense_actual ?? 0) - (x.income_actual ?? 0));
        const over = used > (x.limit_amount ?? 0);
        return status === 'over' ? over : !over;
      });
    }
    if (q.trim()) {
      const ql = q.toLowerCase();
      arr = arr.filter((x) => {
        const name = catName(x.category_id).toLowerCase();
        const note = (x.note ?? '').toLowerCase();
        return name.includes(ql) || note.includes(ql);
      });
    }
    return arr;
  }, [progress?.items, categoryId, status, q, catName]);

  const cardTotal = gridFiltered.length;
  const cardPages = Math.max(1, Math.ceil(cardTotal / Math.max(1, cardLimit)));
  const gridPageItems = gridFiltered.slice(
    (cardPage - 1) * cardLimit,
    (cardPage - 1) * cardLimit + cardLimit
  );

  //  SKELETON LẦN ĐẦU
  const firstLoading =
    (!progress && loadingProgress) ||
    (!categories && loadingCategories) ||
    (!budgetList && loadingBudgets);

  if (firstLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 bg-gray-50 dark:bg-neutral-900 dark:border-neutral-800 space-y-2 animate-pulse"
              >
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-52 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Filter + grid skeleton */}
        <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900 space-y-4">
          {/* filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-full md:w-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>

          {/* grid cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 bg-gray-50 dark:bg-neutral-900 dark:border-neutral-800 space-y-3 animate-pulse"
              >
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="flex justify-between pt-2">
                  <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>

          {/* grid pagination skeleton */}
          <div className="flex items-center justify-between mt-4">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-8 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900 space-y-4">
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-full border-t border-gray-200 dark:border-neutral-800" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-3 py-3 border-b border-gray-100 dark:border-neutral-800"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="flex justify-end gap-2">
                <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-8 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/*tháng*/}
          <div className="flex items-center gap-2">
            <input
              type="month"
              className="rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
                setCardPage(1);
              }}
            />

            {fetchingProgress && !loadingProgress && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                Đang cập nhật…
              </span>
            )}
          </div>

          {/*thêm ngân sách */}
          <div>
            <button
              onClick={() => setOpenForm({ mode: 'create' })}
              className="px-3 py-2 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-500"
            >
              + Thêm ngân sách
            </button>
          </div>
        </div>

        {/* 3 thẻ KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Hạn mức</div>
            <div className="text-2xl font-semibold">
              {header.limit_total.toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Thu</div>
            <div className="text-2xl font-semibold text-green-600">
              {header.income_total.toLocaleString('vi-VN')}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Chi</div>
            <div className="text-2xl font-semibold text-red-600">
              {header.expense_total.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-neutral-500 mb-1">
            <span>Tiến độ</span>
            <span>{Math.round(overallProgress * 100)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.round(overallProgress * 100))}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Đã dùng: {header.used.toLocaleString('vi-VN')} • Còn lại:{' '}
            {remain.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Bộ lọc + GRID*/}
      <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900 space-y-4">
        <BudgetFilterBar
          period={period}
          setPeriod={(v) => {
            setPeriod(v);
            setPage(1);
            setCardPage(1);
          }}
          q={q}
          setQ={(v) => {
            setQ(v);
            setPage(1);
            setCardPage(1);
          }}
          categoryId={categoryId}
          setCategoryId={(v) => {
            setCategoryId(v);
            setPage(1);
            setCardPage(1);
          }}
          status={status}
          setStatus={(v) => {
            setStatus(v);
            setPage(1);
            setCardPage(1);
          }}
          categories={categories ?? []}
          onOpenCopy={() => setOpenCopy(true)}
        />

        <BudgetProgressGrid
          period={period}
          items={gridPageItems as ProgressItemAPI[]}
          catName={catName}
          onEdit={(it) => {
            const found = (budgetList?.items ?? []).find(
              (b) => b.categoryId === it.category_id
            );
            if (found) setOpenForm({ mode: 'edit', data: found });
          }}
          onDelete={(it) => {
            const found = (budgetList?.items ?? []).find(
              (b) => b.categoryId === it.category_id
            );
            if (found) onDelete(found.id);
          }}
          total={cardTotal}
          page={cardPage}
          pageSize={cardLimit}
          onPage={(p) => setCardPage(Math.min(Math.max(1, p), cardPages))}
          onLimit={(n) => {
            setCardLimit(n);
            setCardPage(1);
          }}
        />
      </div>

      {/* Bảng (server paginate) */}
      <div className="rounded-2xl border p-4 md:p-6 bg-white dark:bg-neutral-900 space-y-4">
        <BudgetTable
          data={(search?.data?.items ?? []) as any}
          page={search?.data?.meta.page ?? 1}
          pages={search?.data?.meta.pages ?? 1}
          total={search?.data?.meta.total ?? 0}
          pageSize={limit}
          onPage={(p) => setPage(p)}
          onLimit={(n) => {
            setLimit(n);
            setPage(1);
          }}
          onEdit={(it) => {
            const found = (budgetList?.items ?? []).find(
              (b) => b.categoryId === it.category_id
            );
            if (found) setOpenForm({ mode: 'edit', data: found });
          }}
          onDelete={(it) => {
            const found = (budgetList?.items ?? []).find(
              (b) => b.categoryId === it.category_id
            );
            if (found && confirm('Xác nhận xoá ngân sách này?')) onDelete(found.id);
          }}
        />
      </div>

      {/* Modals */}
      {openForm && (
        <BudgetFormModal
          mode={openForm.mode}
          onClose={() => setOpenForm(null)}
          categories={categories ?? []}
          defaultValue={
            openForm.mode === 'edit'
              ? openForm.data!
              : {
                  id: 0,
                  categoryId: categories?.[0]?.id ?? 0,
                  period,
                  limit_amount: 0,
                  note: '',
                }
          }
          onSubmit={(data) => {
            if (openForm.mode === 'create')
              onCreate({
                categoryId: data.categoryId,
                limit_amount: data.limit_amount,
                note: data.note,
              });
            else
              onUpdate(openForm.data!.id, {
                categoryId: data.categoryId,
                limit_amount: data.limit_amount,
                note: data.note,
              });
          }}
        />
      )}

      {openCopy && (
        <BudgetCopyModal
          fromPeriod={period}
          onClose={() => setOpenCopy(false)}
          onCopy={onCopy}
        />
      )}
    </div>
  );
}
