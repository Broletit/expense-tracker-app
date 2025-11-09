'use client';

import { useMemo, useState } from 'react';
import { useCategories } from '@/lib/queries/categories';
import {
  ExpenseParams,
  useBulkDeleteExpenses,
  useCreateExpense,
  useDeleteExpense,
  useExpensesList,
  useExpenseStats,
  useUpdateExpense,
} from '@/lib/queries/expenses';

import ExpenseForm, { ExpenseFormValue } from '@/components/expenses/ExpenseForm';
import ExpensesStatsRow from '@/components/expenses/ExpensesStatsRow';
import ExpensesFiltersBar from '@/components/expenses/ExpensesFiltersBar';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpensesPagination from '@/components/expenses/ExpensesPagination';
import ExpenseDialog from '@/components/expenses/ExpensesDialog';

export default function ExpensesPage() {
  // Bộ lọc / sắp xếp / phân trang
  const [params, setParams] = useState<ExpenseParams>({
    page: 1,
    limit: 10,
    sort: 'date:desc',
  });
  const [q, setQ] = useState('');
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [openAdd, setOpenAdd] = useState(false);

  // Queries
  const { data: cats, isLoading: catsLoading } = useCategories();
  const {
    data: list,
    refetch,
    isLoading: listLoading,
    isFetching: listFetching,
  } = useExpensesList({ ...params, q, ...range });

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
  } = useExpenseStats({
    q,
    category_id: params.category_id,
    kind: (params as any).kind,
    ...range,
  });

  const anyFetching = listFetching || statsFetching;
  const firstLoading = (catsLoading || listLoading || statsLoading) && !list && !stats;

  // Mutations
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const del = useDeleteExpense();
  const bulk = useBulkDeleteExpenses();

  const totalPages = useMemo(() => {
    if (!list) return 1;
    return Math.max(1, Math.ceil(list.total / list.pageSize));
  }, [list]);

  //  Thêm khoản
  function onSubmitCreate(v: ExpenseFormValue) {
    create.mutate(
      {
        category_id: Number(v.category_id),
        amount: Number(v.amount),
        description: v.note ?? '',
        date: v.spent_at,
        kind: v.kind ?? 'expense',
      },
      {
        onSuccess: () => {
          setOpenAdd(false);
          refetch(); 
        },
        onError: (err: any) => alert(`Thêm thất bại: ${err?.message ?? 'Có lỗi xảy ra'}`),
      }
    );
  }

  //  Sửa khoản
  function onSubmitEdit(v: ExpenseFormValue) {
    if (!editing?.id) return;
    update.mutate(
      {
        id: editing.id,
        data: {
          category_id: Number(v.category_id),
          amount: Number(v.amount),
          description: v.note ?? '',
          date: v.spent_at,
          kind: v.kind ?? 'expense',
        },
      },
      {
        onSuccess: () => {
          setEditing(null);
          refetch(); 
        },
        onError: (err: any) => alert(`Cập nhật thất bại: ${err?.message ?? 'Có lỗi xảy ra'}`),
      }
    );
  }

  // Chọn nhiều
  function toggleSelect(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleSelectAll(checked: boolean) {
    if (!list?.items) return;
    setSelected(checked ? list.items.map((i) => i.id) : []);
  }

  // Xoá 1 dòng
  function handleDeleteOne(id: number) {
    const ok = window.confirm('Bạn có chắc muốn xoá khoản này? Hành động không thể hoàn tác.');
    if (!ok) return;
    del.mutate(id);
  }

  // Xoá hàng loạt
  function handleBulkDelete() {
    if (selected.length === 0) return;
    const ok = window.confirm(`Xoá ${selected.length} khoản đã chọn? Hành động không thể hoàn tác.`);
    if (!ok) return;
    bulk.mutate(selected, { onSuccess: () => setSelected([]) });
  }

  if (firstLoading) {
    return (
      <div className="space-y-6">
        {/* Thanh tiêu đề + trạng thái */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-8 w-32 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        {/* Hàng stats (4 card) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3 animate-pulse"
            >
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        {/* Thanh filter giả */}
        <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3 animate-pulse">
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-56 rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-9 w-32 rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-9 w-32 rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-9 w-24 rounded-md bg-gray-100 dark:bg-gray-800 ml-auto" />
          </div>
        </div>

        {/* Bảng skeleton */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 animate-pulse">
          <div className="h-4 w-full mb-4 rounded bg-gray-100 dark:bg-gray-800" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-full mb-2 rounded bg-gray-50 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hàng stats + trạng thái fetch nhỏ nhỏ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <ExpensesStatsRow
            totalExpense={stats?.totalExpense ?? 0}
            totalIncome={stats?.totalIncome ?? 0}
            diff={stats?.diff ?? 0}
            maxExpense={stats?.maxExpense ?? 0}
          />
        </div>

        {anyFetching && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            Đang cập nhật…
          </span>
        )}
      </div>

      {/* Thanh lọc */}
      <ExpensesFiltersBar
        params={params}
        setParams={setParams}
        q={q}
        setQ={setQ}
        range={range}
        setRange={setRange}
        cats={cats ?? []}
        selectedCount={selected.length}
        onBulkDelete={handleBulkDelete}
        onAdd={() => setOpenAdd(true)}
      />

      {/* Bảng */}
      <ExpensesTable
        list={list}
        selected={selected}
        onToggle={toggleSelect}
        onToggleAll={toggleSelectAll}
        onEdit={(e) => setEditing(e)}
        onDelete={(id) => handleDeleteOne(id)}
      />

      {/* Phân trang */}
      <ExpensesPagination
        total={list?.total ?? 0}
        page={params.page ?? 1}
        pageSize={params.limit ?? 10}
        onPage={(p) => setParams((old) => ({ ...old, page: p }))}
        onLimit={(n) => setParams((old) => ({ ...old, limit: n, page: 1 }))}
      />

      {/* Dialog Thêm & Sửa */}
      {openAdd && (
        <ExpenseDialog title="Thêm khoản" onClose={() => setOpenAdd(false)}>
          <ExpenseForm
            submitText="Thêm"
            cats={cats ?? []}
            loading={create.isPending}
            onSubmit={onSubmitCreate}
          />
        </ExpenseDialog>
      )}

      {editing && (
        <ExpenseDialog title="Sửa khoản" onClose={() => setEditing(null)}>
          <ExpenseForm
            cats={cats ?? []}
            loading={update.isPending}
            initial={{
              id: editing.id,
              category_id: editing.category_id,
              amount: editing.amount,
              note: editing.description ?? '',
              spent_at: (editing.date ?? '').slice(0, 10),
              kind: editing.kind ?? 'expense',
            }}
            submitText="Cập nhật"
            onSubmit={onSubmitEdit}
          />
        </ExpenseDialog>
      )}
    </div>
  );
}
