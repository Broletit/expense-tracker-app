'use client';

export default function ExpensesStatsRow({
  totalExpense,
  totalIncome,
  diff,
  maxExpense,
}: {
  totalExpense: number;
  totalIncome: number;
  diff: number;
  maxExpense: number;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

  const cards = [
    { label: 'Tổng chi', value: fmt(totalExpense) },
    { label: 'Tổng thu', value: fmt(totalIncome) },
    { label: 'Chênh lệch', value: fmt(diff), positive: diff >= 0 },
    { label: 'Khoản chi lớn nhất', value: fmt(maxExpense) },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border p-4 bg-white">
          <div className="text-xs text-gray-500">{c.label}</div>
          <div className={`mt-1 text-lg font-semibold ${c.positive === true ? 'text-emerald-600' : c.positive === false ? 'text-rose-600' : 'text-gray-900'}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
