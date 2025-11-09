'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoriesPagination({
  total, page, pageSize, onPage, onLimit,
}:{
  total:number; page:number; pageSize:number;
  onPage:(p:number)=>void; onLimit:(n:number)=>void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">Tổng: {total} bản ghi</div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm">Trang {page}/{totalPages}</span>
        <button
          className="px-2 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          <ChevronRight className="size-4" />
        </button>
        <select
          className="border rounded px-2 py-1 bg-white"
          value={pageSize}
          onChange={(e) => onLimit(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(n => (
            <option key={n} value={n}>{n}/trang</option>
          ))}
        </select>
      </div>
    </div>
  );
}
