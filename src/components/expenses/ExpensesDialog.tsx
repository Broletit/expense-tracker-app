'use client';

export default function ExpenseDialog({
  title, children, onClose,
}:{ title:string; children:React.ReactNode; onClose:()=>void; }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-lg border bg-white shadow-xl">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <button onClick={onClose} className="px-2 py-1 rounded border hover:bg-gray-100">Đóng</button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
