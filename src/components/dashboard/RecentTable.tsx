'use client';

import React from 'react';
import Panel from '@/components/ui/Panel';
import { Th, Td } from '@/components/ui/Table';
import { useExpensesList } from '@/lib/queries/expenses';

const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

type Props = {
  month?: string;
};

function monthToRange(m: string) {
  const [y, mo] = m.split('-').map(Number);
  const end = new Date(y, mo, 0).getDate();
  return { from: `${m}-01`, to: `${m}-${String(end).padStart(2, '0')}` };
}

// Chuẩn hoá 1 bản ghi từ API về cùng format
function normalizeRow(raw: any) {
  const date =
    raw?.date ??
    raw?.spent_at ??
    raw?.created_at ??
    '';

  const kind: 'expense' | 'income' =
    raw?.kind === 'income' ? 'income' : 'expense';

  const amount =
    Number(raw?.amount ?? raw?.value ?? 0);

  const description =
    raw?.description ?? raw?.note ?? raw?.content ?? null;

  const categoryName =
    raw?.categoryName ?? raw?.category_name ?? null;

  const icon =
    raw?.icon ?? raw?.category_icon ?? null;

  const color =
    raw?.color ?? raw?.category_color ?? null;

  const id =
    Number(raw?.id ?? raw?.expense_id ?? raw?.tx_id ?? Math.random() * 1e9);

  return { id, date, kind, amount, description, categoryName, icon, color };
}

export default function RecentTable({ month }: Props) {
  const selectedMonth = month || new Date().toISOString().slice(0, 7);
  const { from, to } = monthToRange(selectedMonth);

  const { data, isLoading } = useExpensesList({
    page: 1,
    limit: 10,
    sort: 'date:desc',
    from,
    to,
  });

  const rows = React.useMemo(() => {
    const list = data?.items ?? [];
    return list.map(normalizeRow);
  }, [data]);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Giao dịch gần đây ({selectedMonth})</h2>

      <Panel className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <Th>Ngày</Th>
              <Th>Danh mục</Th>
              <Th>Ghi chú</Th>
              <Th className="text-right">Số tiền</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="odd:bg-white even:bg-gray-50 dark:odd:bg-neutral-900 dark:even:bg-neutral-950">
                  <Td><div className="h-4 w-20 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" /></Td>
                  <Td><div className="h-4 w-40 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" /></Td>
                  <Td><div className="h-4 w-64 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" /></Td>
                  <Td className="text-right">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse ml-auto" />
                  </Td>
                </tr>
              ))}

            {!isLoading &&
              rows.map((e) => {
                const isIncome = e.kind === 'income';
                const sign = isIncome ? '+' : '-';
                return (
                  <tr key={e.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-neutral-900 dark:even:bg-neutral-950">
                    <Td>{(e.date ?? '').slice(0, 10)}</Td>

                    <Td className="max-w-[220px] truncate">
                      {e.icon && <span className="mr-1">{e.icon}</span>}
                      <span className="align-middle">{e.categoryName ?? '—'}</span>
                    </Td>

                    <Td className="max-w-[420px] truncate">{e.description || '—'}</Td>

                    <Td
                      className={`text-right font-medium ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                      title={fmtVND(e.amount)}
                    >
                      {sign} {fmtVND(Math.abs(e.amount))}
                    </Td>
                  </tr>
                );
              })}

            {!isLoading && rows.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-center py-8 text-gray-500">
                  Không có giao dịch trong tháng này.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}
