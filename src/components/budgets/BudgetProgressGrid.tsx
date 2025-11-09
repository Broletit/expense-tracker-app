'use client';

import { ProgressItemAPI } from '@/lib/queries/budgets';
import CategoriesPagination from '@/components/categories/CategoriesPagination';

type Props = {
  period: string;
  items: ProgressItemAPI[];
  catName: (id: number) => string;
  onEdit: (item: ProgressItemAPI) => void;
  onDelete: (item: ProgressItemAPI) => void;

  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onLimit: (n: number) => void;
};

export default function BudgetProgressGrid({
  period, items, catName, onEdit, onDelete,
  total, page, pageSize, onPage, onLimit,
}: Props) {
  return (
    <div className="space-y-4">
      {/* cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => {
          const used = Math.max(0, (it.expense_actual ?? 0) - (it.income_actual ?? 0));
          const limit = it.limit_amount ?? 0;
          const percent = limit > 0 ? Math.min(1, used / limit) : 0;
          const over = used > limit;
          const name = (it as any).cat_name ?? catName(it.category_id);

          return (
            <div key={it.id} className={`rounded-2xl border p-4 ${over ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{name}</div>
                <div className="flex items-center gap-2">
                  {over && <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white">Vượt hạn mức</span>}
                  <button
                    onClick={() => onEdit(it)}
                    className="px-3 py-1 rounded border text-[13px] hover:bg-gray-50 dark:hover:bg-neutral-800"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => { if (confirm('Xác nhận xoá ngân sách này?')) onDelete(it); }}
                    className="px-3 py-1 rounded border text-[13px] text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Hạn mức</div>
                  <div className="font-semibold">{(limit).toLocaleString('vi-VN')}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Thu</div>
                  <div className="font-semibold">{(it.income_actual ?? 0).toLocaleString('vi-VN')}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-neutral-500">Chi</div>
                  <div className="font-semibold">{(it.expense_actual ?? 0).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Tiến độ</span>
                  <span>{Math.round(percent * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.round(percent * 100))}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Đã dùng: {used.toLocaleString('vi-VN')} • Còn lại: {Math.max(0, limit - used).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full text-center text-sm text-neutral-500 py-10">
            Không có ngân sách phù hợp bộ lọc
          </div>
        )}
      </div>

      {/* footer phân trang — dùng CategoriesPagination */}
      <CategoriesPagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPage={onPage}
        onLimit={onLimit}
      />
    </div>
  );
}
