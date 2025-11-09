'use client';
import { Plus } from 'lucide-react';

export default function CategoriesHeader({
  isReordering, onCancel, onSave, onAdd, saving,
}:{
  isReordering:boolean; onCancel:()=>void; onSave:()=>void; onAdd:()=>void; saving?:boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Danh mục</h1>
        <p className="text-sm text-gray-500">Quản lý nhóm chi tiêu & kéo-thả để sắp xếp.</p>
      </div>
      <div className="flex gap-2">
        {isReordering ? (
          <>
            <button className="px-3 py-2 rounded border bg-gray-50" onClick={onCancel}>Hủy sắp xếp</button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={onSave} disabled={saving}>Lưu thứ tự</button>
          </>
        ) : (
          <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={onAdd}>
            <Plus className="inline size-4 mr-1" /> Thêm danh mục
          </button>
        )}
      </div>
    </div>
  );
}
