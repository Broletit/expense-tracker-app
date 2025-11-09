'use client';

import { ProgressItemAPI } from '@/lib/queries/budgets';
import CategoriesPagination from '@/components/categories/CategoriesPagination';

type Item = ProgressItemAPI & { cat_name: string; cat_icon: string | null };
type Props = {
  data: Item[];
  page: number; pages: number; total: number;
  pageSize: number;                    
  onPage: (p: number)=>void;
  onLimit: (n: number)=>void;          
  onEdit: (it: Item)=>void;
  onDelete: (it: Item)=>void;
};

export default function BudgetTable({ data, page, pages, total, pageSize, onPage, onLimit, onEdit, onDelete }: Props) {
  const totalPages = Math.max(1, pages);

  return (
    <div className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="text-left px-4 py-3">Danh mục</th>
            <th className="text-right px-4 py-3">Hạn mức</th>
            <th className="text-right px-4 py-3">Thu</th>
            <th className="text-right px-4 py-3">Chi</th>
            <th className="text-right px-4 py-3">Đã dùng</th>
            <th className="text-right px-4 py-3">Còn lại</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(it=>{
            const used = Math.max(0, (it.expense_actual ?? 0) - (it.income_actual ?? 0));
            const remain = Math.max(0, (it.limit_amount ?? 0) - used); 
            const over = used > (it.limit_amount ?? 0);
            return (
              <tr key={it.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{it.cat_icon ?? '📁'}</span>
                    <span className="font-medium">{it.cat_name}</span>
                  </div>
                  {it.note ? <div className="text-xs text-neutral-500 mt-0.5">{it.note}</div> : null}
                </td>
                <td className="px-4 py-3 text-right">{(it.limit_amount ?? 0).toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">{(it.income_actual ?? 0).toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">{(it.expense_actual ?? 0).toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">{used.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">{remain.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3">
                  {over ? <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white">Vượt</span>
                        : <span className="text-xs px-2 py-1 rounded-full bg-emerald-500 text-white">OK</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={()=>onEdit(it)} className="px-3 py-1 rounded border text-[13px] hover:bg-gray-50 dark:hover:bg-neutral-800 mr-2">Sửa</button>
                  <button onClick={()=>onDelete(it)} className="px-3 py-1 rounded border text-[13px] text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">Xoá</button>
                </td>
              </tr>
            );
          })}
          {data.length===0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">Không có ngân sách</td></tr>
          )}
        </tbody>
      </table>

      {/* footer phân trang — dùng CategoriesPagination */}
      <div className="px-4 py-3 border-t">
        <CategoriesPagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={(p)=> onPage(Math.min(Math.max(1,p), totalPages))}
          onLimit={onLimit}
        />
      </div>
    </div>
  );
}
