import React from 'react';

type Item = {
  id: number;
  date: string; 
  category_id?: number | null;
  category_name?: string | null;
  description?: string | null;
  amount: number;
  kind?: 'expense' | 'income';
};

type List = {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
};

type Props = {
  list?: List | null;
  selected: number[];
  onToggle: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: number) => void;
};

function fmtMoney(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

export default function ExpensesTable({
  list,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete
}: Props) {
  const items = list?.items ?? [];
  const allChecked = items.length > 0 && items.every((i) => selected.includes(i.id));

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-3 py-2 w-10">
              <input type="checkbox" checked={allChecked} onChange={(e) => onToggleAll(e.target.checked)} />
            </th>
            <th className="px-3 py-2">Ngày</th>
            <th className="px-3 py-2">Danh mục</th>
            <th className="px-3 py-2">Loại</th>
            <th className="px-3 py-2">Ghi chú</th>
            <th className="px-3 py-2 text-right">Số tiền</th>
            <th className="px-3 py-2 w-28 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                Chưa có dữ liệu
              </td>
            </tr>
          )}

          {items.map((r) => {
            const isChecked = selected.includes(r.id);
            const isIncome = r.kind === 'income';
            const sign = isIncome ? '+' : '-';
            return (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={isChecked} onChange={() => onToggle(r.id)} />
                </td>
                <td className="px-3 py-2">{(r.date ?? '').slice(0, 10)}</td>
                <td className="px-3 py-2">{r.category_name ?? '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isIncome ? 'Thu' : 'Chi'}
                  </span>
                </td>
                <td className="px-3 py-2">{r.description ?? '—'}</td>
                <td className={`px-3 py-2 text-right font-medium ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {sign} {fmtMoney(r.amount)}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => onEdit(r)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-rose-50 border-rose-400 text-rose-600"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {list && (
        <div className="px-3 py-2 text-sm text-gray-500 border-t">
          Tổng: {items.length} bản ghi
        </div>
      )}
    </div>
  );
}
