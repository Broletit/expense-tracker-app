'use client';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

function Th({ children, className='' }: any) {
  return <th className={`px-3 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className='', colSpan }: any) {
  return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>;
}

export default function CategoriesTable({
  rows, dragIds, onDragStart, onDrop, onDragOver, onEdit, onDelete,
  selected, onToggle, onToggleAll
}:{
  rows: any[]; dragIds: number[] | null;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id:number)=>void;
  onDrop: (e: React.DragEvent<HTMLTableSectionElement | HTMLTableRowElement>, targetId?:number)=>void;
  onDragOver: (e: React.DragEvent)=>void;
  onEdit: (row:any)=>void; onDelete:(row:any)=>void;
  selected: number[];
  onToggle: (id:number)=>void;
  onToggleAll: (checked:boolean)=>void;
}) {
  const allChecked = rows.length>0 && rows.every(r => selected.includes(r.id));

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={allChecked} onChange={(e)=>onToggleAll(e.target.checked)} />
            </Th>
            <Th className="w-10">#</Th>
            <Th>Tên</Th>
            <Th>Biểu tượng</Th>
            <Th>Màu</Th>
            <Th className="text-right">Đang dùng</Th>
            <Th className="w-28 text-right">Thao tác</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100" onDragOver={onDragOver} onDrop={(e)=>onDrop(e, undefined)}>
          {rows.map((c, idx) => {
            const isChecked = selected.includes(c.id);
            return (
              <tr key={c.id} draggable
                onDragStart={(e)=>onDragStart(e, c.id)} onDrop={(e)=>onDrop(e, c.id)}
                className={dragIds ? 'cursor-move bg-white' : ''}>
                <Td className="align-middle">
                  <input type="checkbox" checked={isChecked} onChange={()=>onToggle(c.id)} />
                </Td>
                <Td className="text-gray-400">
                  <GripVertical className="size-4 inline mr-1" />
                  {idx + 1}
                </Td>
                <Td className="font-medium">{c.name}</Td>
                <Td><CategoryIcon icon={c.icon} /></Td>
                <Td>
                  <span className="inline-block size-4 rounded-full align-middle"
                    style={{ background: c.color || '#e5e7eb' }} title={c.color || ''}/>
                </Td>
                <Td className="text-right">{c.usage_count ?? 0}</Td>
                <Td className="text-right">
                  <button
                    className="inline-flex items-center px-2 py-1 rounded border hover:bg-gray-50 mr-1"
                    onClick={()=>onEdit(c)} >Sửa</button>
                  <button
                    className="inline-flex items-center px-2 py-1 rounded border hover:bg-red-50 text-red-600"
                    onClick={()=>onDelete(c)}>Xóa</button>
                </Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><Td colSpan={7} className="text-center py-10 text-gray-500">Chưa có danh mục nào</Td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
