'use client';

type Props = {
  period: string; setPeriod: (v: string) => void;
  q: string; setQ: (v: string) => void;
  categoryId: number; setCategoryId: (v: number) => void;
  status: 'all'|'over'|'under'; setStatus: (v: 'all'|'over'|'under') => void;
  categories: { id:number; name:string; icon?:string; color?:string }[];
  onOpenCopy: () => void;   
};

export default function BudgetFilterBar({
  period, setPeriod,
  q, setQ,
  categoryId, setCategoryId,
  status, setStatus,
  categories,
  onOpenCopy,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Tìm danh mục hoặc ghi chú…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm dark:bg-neutral-900 dark:border-neutral-700"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm dark:bg-neutral-900 dark:border-neutral-700"
        >
          <option value={0}>Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ${c.name}` : c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="rounded-lg border px-2 py-1.5 text-sm dark:bg-neutral-900 dark:border-neutral-700"
        >
          <option value="all">Tất cả</option>
          <option value="over">Vượt hạn mức</option>
          <option value="under">Chưa vượt</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCopy}
          className="px-3 py-1.5 rounded-lg bg-yellow-200 border border-yellow-300 text-yellow-900 hover:bg-yellow-300"
        >
          Sao chép tháng
        </button>
      </div>
    </div>
  );
}
