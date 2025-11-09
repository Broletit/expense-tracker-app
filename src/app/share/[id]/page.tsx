import type { Metadata, ResolvingMetadata } from 'next';
import db from '@/lib/db/client';
import { MonthlyBar, CategoryPie, DailyLine, TinyTrend, WeekdayBar } from './shared-charts';

type Row = {
  id: string;
  user_id: number;
  title: string | null;
  payload: string;            
  filters: string | null;     
  created_at: string;
  expires_at: string | null;
};

type Snapshot = {
  generatedAt?: string;
  monthly?: Array<{ month: string; expense?: number; income?: number }>;
  categories?: Array<{ name: string; expense?: number; income?: number }>;
  daily?: Array<{ day?: string; date?: string; expense: number; income: number }>;
  [k: string]: any;
};

function getSharedDirect(id: string) {
  const row = db
    .prepare(
      `SELECT id, user_id, title, payload, filters, created_at, expires_at
       FROM shared_reports
       WHERE id = ?`
    )
    .get(id) as Row | undefined;

  if (!row) return { status: 'not_found' as const };

  // Hết hạn -> xoá và báo not_found
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM shared_reports WHERE id = ?`).run(id);
    return { status: 'expired' as const };
  }

  let payload: Snapshot = {};
  try {
    payload = row.payload ? JSON.parse(row.payload) : {};
  } catch {
    payload = {};
  }

  return {
    status: 'ok' as const,
    data: {
      id: row.id,
      title: row.title ?? 'Báo cáo chia sẻ',
      created_at: row.created_at,
      expires_at: row.expires_at,
      payload,
    },
  };
}

/* Helpers cho thống kê */
function num(n: any) {
  return Number(n || 0);
}

function computeStats(payload: Snapshot) {
  const daily = payload.daily ?? [];
  const categories = payload.categories ?? [];
  const monthly = payload.monthly ?? [];

  const totalExpense = daily.reduce((s, d) => s + num(d.expense), 0);
  const totalIncome = daily.reduce((s, d) => s + num(d.income), 0);
  const net = totalIncome - totalExpense;
  const dayCount = daily.length || 1;
  const avgExpense = totalExpense / dayCount;
  const avgIncome = totalIncome / dayCount;

  const peakDay =
    daily
      .map((d) => ({ label: d.day || d.date || '', value: num(d.expense) }))
      .sort((a, b) => b.value - a.value)[0] || { label: '-', value: 0 };

  const topExpenseCats = [...categories]
    .map((c) => ({ name: c.name, value: num(c.expense) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topIncomeCats = [...categories]
    .map((c) => ({ name: c.name, value: num(c.income) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Sparkline data (daily) cho TinyTrend 
  const trendData = daily.map((d, i) => ({
    __x: String(i + 1),
    expense: num(d.expense),
    income: num(d.income),
  }));

  // Tổng theo thứ trong tuần (0..6), đổi sang T2..CN cho trực quan VN
  const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekdayAgg = new Map<string, { name: string; expense: number; income: number }>();
  for (const d of daily) {
    const dateStr = d.date || d.day;
    let wdName = '—';
    if (dateStr) {
      const dt = new Date(dateStr);
      const idx = dt.getDay(); // 0=CN
      wdName = weekdayNames[idx] ?? '—';
    }
    const prev = weekdayAgg.get(wdName) || { name: wdName, expense: 0, income: 0 };
    prev.expense += num(d.expense);
    prev.income += num(d.income);
    weekdayAgg.set(wdName, prev);
  }
  const weekly = Array.from(weekdayAgg.values()).sort((a, b) => {
    const order = {
      T2: 1,
      T3: 2,
      T4: 3,
      T5: 4,
      T6: 5,
      T7: 6,
      CN: 7,
      '—': 8,
    } as Record<string, number>;
    return (order[a.name] || 99) - (order[b.name] || 99);
  });

  const recentDaily = [...daily].slice(-10).reverse();

  const lastMonth = monthly?.[monthly.length - 1];

  return {
    totals: { totalExpense, totalIncome, net, avgExpense, avgIncome },
    peakDay,
    topExpenseCats,
    topIncomeCats,
    trendData,
    weekly,
    recentDaily,
    lastMonth,
  };
}

/*SEO: generateMetadata cho trang share công khai */
export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const res = getSharedDirect(params.id);

  if (res.status === 'not_found') {
    return {
      title: 'Báo cáo không tồn tại',
      description: 'Liên kết báo cáo không còn khả dụng.',
    };
  }

  if (res.status === 'expired') {
    return {
      title: 'Liên kết đã hết hạn',
      description:
        'Liên kết báo cáo đã hết hạn, vui lòng yêu cầu chủ sở hữu tạo liên kết mới.',
    };
  }

  const { title, created_at, payload } = res.data;
  const { totals, topExpenseCats } = computeStats(payload);

  const createdDate = new Date(created_at).toLocaleDateString('vi-VN');
  const topCat = topExpenseCats[0]?.name;

  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const descParts: string[] = [
    `Báo cáo thu chi ngày ${createdDate}`,
    `Tổng chi: ${fmt(totals.totalExpense)} đ`,
    `Tổng thu: ${fmt(totals.totalIncome)} đ`,
  ];
  if (topCat) {
    descParts.push(`Danh mục chi nhiều nhất: ${topCat}`);
  }
  const description = descParts.join(' • ');

  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const url = `${base}/share/${params.id}`;

  return {
    title: title || 'Báo cáo chia sẻ',
    description,
    openGraph: {
      title: title || 'Báo cáo chia sẻ',
      description,
      url,
      type: 'article',
      locale: 'vi_VN',
      siteName: 'Expense Tracker',
    },
    twitter: {
      card: 'summary_large_image',
      title: title || 'Báo cáo chia sẻ',
      description,
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const res = getSharedDirect(params.id);

  if (res.status === 'not_found') {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Link không tồn tại</h1>
        <p className="mt-2 text-sm text-gray-500">
          Vui lòng liên hệ chủ sở hữu để yêu cầu liên kết mới.
        </p>
      </main>
    );
  }

  if (res.status === 'expired') {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Liên kết đã hết hạn</h1>
        <p className="mt-2 text-sm text-gray-500">
          Vui lòng yêu cầu chủ sở hữu tạo liên kết mới.
        </p>
      </main>
    );
  }

  const { title, created_at, expires_at, payload } = res.data;
  const monthly = payload?.monthly ?? [];
  const categories = payload?.categories ?? [];
  const daily = payload?.daily ?? [];
  const generatedAt = payload?.generatedAt;

  const {
    totals,
    peakDay,
    topExpenseCats,
    topIncomeCats,
    trendData,
    weekly,
    recentDaily,
  } = computeStats(payload);

  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const fmtVND = (n: number) => `${fmt(n)} đ`;

  const createdDate = new Date(created_at).toISOString();
  const topCat = topExpenseCats[0]?.name;
  const descParts: string[] = [
    `Báo cáo thu chi`,
    `Tổng chi: ${fmt(totals.totalExpense)} đ`,
    `Tổng thu: ${fmt(totals.totalIncome)} đ`,
  ];
  if (topCat) descParts.push(`Danh mục chi nhiều nhất: ${topCat}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title || 'Báo cáo chia sẻ',
    description: descParts.join(' • '),
    datePublished: createdDate,
    dateModified: createdDate,
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{title || 'Báo cáo chia sẻ'}</h1>
        <p className="text-sm text-gray-500">
          Chia sẻ lúc {new Date(created_at).toLocaleString('vi-VN')}
          {expires_at ? ` • Hết hạn: ${new Date(expires_at).toLocaleString('vi-VN')}` : ''}
          {generatedAt ? ` • Snapshot: ${new Date(generatedAt).toLocaleString('vi-VN')}` : ''}
        </p>
      </header>

      {/*KPI Cards*/}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Tổng Thu</div>
          <div className="text-2xl font-semibold">{fmtVND(totals.totalIncome)}</div>
          <div className="mt-3">
            <TinyTrend data={trendData} dataKey="income" label="Xu hướng Thu" />
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Tổng Chi</div>
          <div className="text-2xl font-semibold">{fmtVND(totals.totalExpense)}</div>
          <div className="mt-3">
            <TinyTrend data={trendData} dataKey="expense" label="Xu hướng Chi" />
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Net (Thu − Chi)</div>
          <div
            className={`text-2xl font-semibold ${
              totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {fmtVND(totals.net)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Trung bình ngày: Thu {fmtVND(totals.avgIncome)} • Chi {fmtVND(totals.avgExpense)}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Ngày chi cao nhất</div>
          <div className="text-2xl font-semibold">{fmtVND(peakDay.value)}</div>
          <div className="text-xs text-gray-500 mt-1">{peakDay.label || '—'}</div>
        </div>
      </section>

      {/* Weekday distribution*/}
      <section className="p-4 rounded-xl border">
        <h2 className="text-xl font-semibold mb-2">Phân bổ theo thứ</h2>
        {weekly.length ? (
          <WeekdayBar weekly={weekly} />
        ) : (
          <p className="text-sm text-gray-500">Không có dữ liệu.</p>
        )}
      </section>

      {/* Charts: Monthly / Category / Daily*/}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border">
          <h2 className="text-xl font-semibold mb-2">Tổng quan theo tháng</h2>
          {monthly.length ? (
            <MonthlyBar monthly={monthly} />
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
          )}
        </div>
        <div className="p-4 rounded-xl border">
          <h2 className="text-xl font-semibold mb-2">Cơ cấu theo danh mục</h2>
          {categories.length ? (
            <CategoryPie categories={categories} />
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
          )}
        </div>
      </section>

      <section className="p-4 rounded-xl border">
        <h2 className="text-xl font-semibold mb-2">Diễn biến theo ngày</h2>
        {daily.length ? (
          <DailyLine daily={daily} />
        ) : (
          <p className="text-sm text-gray-500">Không có dữ liệu.</p>
        )}
      </section>

      {/*Top Categories */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border">
          <h3 className="text-lg font-semibold mb-2">Top danh mục Chi</h3>
          {topExpenseCats.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Danh mục</th>
                  <th className="py-1 text-right">Chi</th>
                </tr>
              </thead>
              <tbody>
                {topExpenseCats.map((c) => (
                  <tr key={c.name} className="border-t">
                    <td className="py-1">{c.name}</td>
                    <td className="py-1 text-right">{fmtVND(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
          )}
        </div>

        <div className="p-4 rounded-xl border">
          <h3 className="text-lg font-semibold mb-2">Top danh mục Thu</h3>
          {topIncomeCats.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Danh mục</th>
                  <th className="py-1 text-right">Thu</th>
                </tr>
              </thead>
              <tbody>
                {topIncomeCats.map((c) => (
                  <tr key={c.name} className="border-t">
                    <td className="py-1">{c.name}</td>
                    <td className="py-1 text-right">{fmtVND(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
          )}
        </div>
      </section>

      <section className="p-4 rounded-xl border">
        <h3 className="text-lg font-semibold mb-2">10 ngày gần nhất</h3>
        {recentDaily.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Ngày</th>
                  <th className="py-1 text-right">Chi</th>
                  <th className="py-1 text-right">Thu</th>
                </tr>
              </thead>
              <tbody>
                {recentDaily.map((d, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{(d.day || d.date || '').slice(0, 10)}</td>
                    <td className="py-1 text-right">{fmtVND(num(d.expense))}</td>
                    <td className="py-1 text-right">{fmtVND(num(d.income))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Không có dữ liệu.</p>
        )}
      </section>
    </main>
  );
}
