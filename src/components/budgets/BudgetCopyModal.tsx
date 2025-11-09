'use client';

import { useState } from 'react';

type Props = {
  fromPeriod: string;
  onClose: () => void;
  onCopy: (p: { fromPeriod: string; toPeriod: string; overwrite: boolean }) => void;
};

export default function BudgetCopyModal({ fromPeriod, onClose, onCopy }: Props) {
  const [toPeriod, setToPeriod] = useState(fromPeriod);
  const [overwrite, setOverwrite] = useState(false);

  const submit = () => {
    if (!toPeriod) { alert('Chọn tháng đích'); return; }
    if (toPeriod === fromPeriod) { alert('Tháng đích phải khác tháng nguồn'); return; }
    onCopy({ fromPeriod, toPeriod, overwrite });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border p-5 space-y-4">
        <div className="text-lg font-semibold">Sao chép ngân sách</div>
        <div className="text-sm text-neutral-500">Từ <b>{fromPeriod}</b> sang:</div>
        <input type="month" value={toPeriod} onChange={(e)=>setToPeriod(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"/>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={overwrite} onChange={(e)=>setOverwrite(e.target.checked)} />
          Ghi đè nếu đã tồn tại
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Huỷ</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:text-black">Sao chép</button>
        </div>
      </div>
    </div>
  );
}
