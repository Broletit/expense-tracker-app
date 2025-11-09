// src/components/dashboard/MonthlyCalendar.tsx
'use client';

import * as React from 'react';
import Panel from '@/components/ui/Panel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter, X, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useCategories } from '@/lib/queries/categories';
import { moneyToNumber, fmtVND } from '@/lib/money';

type DailyRow  = { date: string; expense: number; income?: number; count?: number };
type DailyResp = { expenseTotal: number; incomeTotal: number; days: DailyRow[] };

/* MoneyInput - text chỉ số, tự format */
function MoneyInput({
  value, onChange, placeholder
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        onChange(raw);
      }}
      onBlur={(e) => {
        const n = moneyToNumber(e.target.value);
        if (n === undefined) return onChange('');
        onChange(n.toLocaleString('vi-VN'));
      }}
      onFocus={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ''))}
    />
  );
}

/* Panel kéo-thả */
function DraggableFilterPanel({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 16, y: 96 });
  const drag = React.useRef({ active: false, dx: 0, dy: 0 });

  const clamp = React.useCallback((x: number, y: number) => {
    const w = boxRef.current?.offsetWidth ?? 340;
    const h = boxRef.current?.offsetHeight ?? 400;
    const maxX = Math.max(0, (window.innerWidth || 0) - w - 8);
    const maxY = Math.max(0, (window.innerHeight || 0) - h - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    drag.current.active = true;
    drag.current.dx = clientX - pos.x;
    drag.current.dy = clientY - pos.y;
  };

  const onMouseDownHeader = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-close-btn]')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };
  const onTouchStartHeader = (e: React.TouchEvent) => {
    const t = e.touches[0]; if (!t) return;
    const target = e.target as HTMLElement;
    if (target?.closest?.('[data-close-btn]')) return;
    e.preventDefault();
    startDrag(t.clientX, t.clientY);
  };

  React.useEffect(() => {
    const move = (clientX: number, clientY: number) => {
      if (!drag.current.active) return;
      const nx = clientX - drag.current.dx;
      const ny = clientY - drag.current.dy;
      setPos(clamp(nx, ny));
    };
    const mm = (e: MouseEvent) => move(e.clientX, e.clientY);
    const mu = () => (drag.current.active = false);
    const tm = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const tu = () => (drag.current.active = false);

    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [clamp]);

  if (!open) return null;

  return (
    <div
      ref={boxRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-[320px] sm:w-[360px] rounded-xl border bg-white/95 shadow-2xl"
    >
      <div
        className="cursor-move select-none border-b px-3 py-2 rounded-t-xl bg-gray-100/90 flex items-center justify-between"
        onMouseDown={onMouseDownHeader}
        onTouchStart={onTouchStartHeader}
      >
        <div className="font-semibold text-sm flex items-center gap-2">
          <span className="text-gray-400"></span> {title}
        </div>
        <button
          data-close-btn
          aria-label="Đóng"
          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-200"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* Chọn danh mục inline trong panel */
function CategoryInlinePicker({
  value, onChange, onClose
}: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const { data: cats = [] } = useCategories();
  const [q, setQ] = React.useState('');

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(s));
  }, [q, cats]);

  return (
    <div className="absolute inset-0 z-10 rounded-xl bg-white/95 backdrop-blur-sm border shadow-inner p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-gray-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tìm danh mục..."
        />
      </div>

      <div className="max-h-64 overflow-auto mt-1 space-y-1 pr-1">
        <button
          onClick={() => { onChange('all'); onClose(); }}
          className={`w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-gray-100 ${value === 'all' ? 'bg-blue-50' : ''}`}
        >
          <span className="flex items-center gap-2"><span>🏷️</span> Tất cả</span>
          {value === 'all' && <Check className="size-4 text-blue-600" />}
        </button>

        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => { onChange(String(c.id)); onClose(); }}
            className={`w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-gray-100 ${String(c.id) === value ? 'bg-blue-50' : ''}`}
          >
            <span className="flex items-center gap-2"><span>{c.icon ?? '📁'}</span>{c.name}</span>
            {String(c.id) === value && <Check className="size-4 text-blue-600" />}
          </button>
        ))}
      </div>

      <div className="text-right">
        <Button size="sm" variant="outline" onClick={onClose}>Quay lại</Button>
      </div>
    </div>
  );
}

type Props = {
  /** YYYY-MM; nếu truyền => controlled mode (ẩn Prev/Next, khoá theo tháng này) */
  month?: string;
};

export default function MonthlyCalendar({ month }: Props) {
  const queryClient = useQueryClient();

  // Controlled vs Uncontrolled month
  const controlled = !!month;
  const [cursor, setCursor] = React.useState(() => new Date());
  React.useEffect(() => {
    if (controlled && month) {
      const d = new Date(`${month}-01T00:00:00`);
      if (!Number.isNaN(d.getTime())) setCursor(d);
    }
  }, [controlled, month]);

  const monthStr = controlled ? (month as string) : format(cursor, 'yyyy-MM');

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<{
    kind: 'all' | 'expense' | 'income';
    category_id: 'all' | string;
    min: string;
    max: string;
  }>({ kind: 'all', category_id: 'all', min: '', max: '' });

  const { data: cats = [] } = useCategories();
  const selectedCat = React.useMemo(
    () => (filters.category_id === 'all' ? null : cats.find((c) => String(c.id) === filters.category_id)),
    [cats, filters.category_id]
  );

  const qs = new URLSearchParams({ month: monthStr });
  if (filters.kind !== 'all') qs.set('kind', filters.kind);
  if (filters.category_id !== 'all') qs.set('category_id', filters.category_id);
  const minN = moneyToNumber(filters.min);
  const maxN = moneyToNumber(filters.max);
  if (minN !== undefined) qs.set('min', String(minN));
  if (maxN !== undefined) qs.set('max', String(maxN));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'daily', monthStr, { ...filters, minN, maxN }],
    queryFn: async () => {
      const r = await fetch(`/api/reports/daily?${qs.toString()}`, {
        cache: 'no-store',
        headers: { 'cache-control': 'no-store' },
        credentials: 'same-origin',
      });
      const j = await r.json().catch(() => ({}));
      const payload: DailyResp =
        j?.data || j?.items || j || { expenseTotal: 0, incomeTotal: 0, days: [] };
      return payload as DailyResp;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Lắng nghe đăng nhập/đăng xuất để refetch ngay (không cần F5)
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth:changed') {
        queryClient.invalidateQueries({ queryKey: ['reports', 'daily'], exact: false });
        refetch();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient, refetch]);

  const gridDays = React.useMemo(() => {
    const base = new Date(`${monthStr}-01T00:00:00`);
    const start = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(base),   { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStr]);

  const map = React.useMemo(() => {
    const m = new Map<string, DailyRow>();
    (data?.days ?? []).forEach((d) => m.set(d.date, d));
    return m;
  }, [data]);

  const expense = data?.expenseTotal ?? 0;
  const income  = data?.incomeTotal  ?? 0;
  const diff    = income - expense;

  const [pickCat, setPickCat] = React.useState(false);

  return (
    <Panel className="p-2 md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {!controlled && (
            <button className="p-2 rounded hover:bg-gray-100" onClick={() => setCursor((d) => addMonths(d, -1))} aria-label="Prev">
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="text-lg md:text-xl font-semibold">
            {format(new Date(`${monthStr}-01T00:00:00`), 'MMMM yyyy', { locale: vi })}
          </div>
          {!controlled && (
            <button className="p-2 rounded hover:bg-gray-100" onClick={() => setCursor((d) => addMonths(d, 1))} aria-label="Next">
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>

        <Button variant="outline" className="gap-2" onClick={() => setFilterOpen(true)}>
          <Filter className="size-4" /> Bộ lọc
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3">
        <SummaryBox label="Tổng thu" value={fmtVND(income)} className="text-blue-600" />
        <SummaryBox label="Tổng chi" value={fmtVND(expense)} />
        <SummaryBox label="Chênh lệch" value={fmtVND(diff)} className={diff >= 0 ? 'text-emerald-600' : 'text-red-600'} />
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-md overflow-hidden border border-gray-200 bg-gray-200">
        {isLoading &&
          Array.from({ length: 42 }).map((_, i) => <div key={i} className="h-20 bg-white animate-pulse" />)}

        {!isLoading &&
          gridDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const row = map.get(key);
            const inMonth = isSameMonth(d, new Date(`${monthStr}-01T00:00:00`));
            const today   = isToday(d);

            return (
              <div
                key={key}
                className={`h-24 md:h-28 bg-white p-2 flex flex-col justify-between
                  ${!inMonth ? 'bg-gray-50 text-gray-400' : ''} ${today ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="text-xs">{format(d, 'd', { locale: vi })}</div>
                <div className="text-right leading-4">
                  <div className="text-rose-600 text-[11px] md:text-xs font-semibold">
                    {row?.expense ? row.expense.toLocaleString('vi-VN') : ''}
                  </div>
                  <div className="text-blue-600 text-[11px] md:text-xs font-semibold">
                    {row?.income ? row.income.toLocaleString('vi-VN') : ''}
                  </div>
                  <div className="text-gray-500 text-[10px] md:text-[11px]">
                    {row?.count ? `${row.count} gd` : ''}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bộ lọc nhanh (draggable) – giữ nguyên các phần còn lại */}
      <DraggableFilterPanel
        open={filterOpen}
        onClose={() => { setPickCat(false); setFilterOpen(false); }}
        title="Bộ lọc nhanh"
      >
        <div className={`relative ${pickCat ? 'pointer-events-none opacity-40' : ''}`}>
          {/* Kind */}
          <div className="mb-3">
            <Label className="mb-1 block text-xs text-gray-500">Loại</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['all','expense','income'] as const).map(k => (
                <Button
                  key={k}
                  variant={filters.kind === k ? 'default' : 'outline'}
                  onClick={() => setFilters(f => ({ ...f, kind: k }))}
                >
                  {k === 'all' ? 'Tất Cả' : k === 'expense' ? 'Chi' : 'Thu'}
                </Button>
              ))}
            </div>
          </div>

          {/* Category picker trigger */}
          <div className="mb-3">
            <Label className="mb-1 block text-xs text-gray-500">Danh mục</Label>
            <Button variant="outline" className="w-full justify-between" onClick={() => setPickCat(true)}>
              <span className="truncate flex items-center gap-2">
                {selectedCat ? (<><span>{selectedCat.icon ?? '📁'}</span><span>{selectedCat.name}</span></>) : (<>Tất cả</>)}
              </span>
              <span className="opacity-60">▼</span>
            </Button>
          </div>

          {/* Amount */}
          <div className="mb-1">
            <Label className="mb-1 block text-xs text-gray-500">Số tiền</Label>
            <div className="grid grid-cols-2 gap-2">
              <MoneyInput value={filters.min} onChange={(v) => setFilters(f => ({ ...f, min: v }))} placeholder="Từ" />
              <MoneyInput value={filters.max} onChange={(v) => setFilters(f => ({ ...f, max: v }))} placeholder="Đến" />
            </div>
          </div>
          <p className="text-[11px] text-gray-500">Chỉ nhập số, tự định dạng khi rời ô.</p>

          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ kind: 'all', category_id: 'all', min: '', max: '' })}
            >
              Xoá lọc
            </Button>
          </div>
        </div>

        {/* Overlay chọn danh mục */}
        {pickCat && (
          <CategoryInlinePicker
            value={filters.category_id}
            onChange={(v) => setFilters((f) => ({ ...f, category_id: v as any }))}
            onClose={() => setPickCat(false)}
          />
        )}
      </DraggableFilterPanel>
    </Panel>
  );
}

function SummaryBox({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className={`font-semibold ${className}`}>{value}</div>
    </div>
  );
}
