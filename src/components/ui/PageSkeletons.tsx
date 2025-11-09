'use client';

export default function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Thanh trên cùng (filter / search / nút) */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-64 rounded-xl skeleton" />
        <div className="h-10 w-40 rounded-full skeleton" />
      </div>

      {/* Hàng 4 card nhỏ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4 space-y-3"
          >
            <div className="h-3 w-24 rounded skeleton" />
            <div className="h-4 w-32 rounded skeleton" />
            <div className="h-2.5 w-full rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Khối nội dung lớn bên dưới (bảng / chart / calendar) */}
      <div className="rounded-2xl border border-gray-100 bg-white dark:bg-neutral-900 dark:border-neutral-800 p-4">
        <div className="h-4 w-40 rounded mb-4 skeleton" />
        <div className="h-[420px] w-full rounded-2xl skeleton" />
      </div>
    </div>
  );
}
