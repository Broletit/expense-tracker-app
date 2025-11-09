import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { requireUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportBody = {
  format: 'csv' | 'pdf' | 'excel';
  kind?: 'expense' | 'income' | 'both';
  month?: string;      
  from?: string;       
  to?: string;         
  topN?: number;       
};

const APP_NAME = 'Expense Tracker';
const REPORT_VERSION = 'v1.3.1';

// Utils 
function hasCol(db: Database.Database, table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}
function csvSafe(s: any) {
  const str = s == null ? '' : String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
const fmtVND = (n: number) => (Number(n) || 0).toLocaleString('vi-VN');

function yyyymm(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function prevMonthStr(ym: string, back: number) {
  const [Y, M] = ym.split('-').map(Number);
  const d = new Date(Y, M - 1 - back, 1);
  return yyyymm(d);
}

//Core query pack
type ReportPack = {
  meta: { generatedAt: string; periodText: string; userId: number; monthForTrend: string; };
  totals: {
    totalExpense: number; totalIncome: number; diff: number;
    txCount: number; avgExpense: number; avgIncome: number;
    maxExpense: number; minExpense: number; maxIncome: number; minIncome: number;
  };
  monthly: { month: string; expense: number; income: number }[]; 
  daily: { day: string; expense: number; income: number }[];
  categories: { id: number; name: string; expense: number; income: number }[];
  topExpense: { id: number; date: string; kind: string; category: string; description: string; amount: number }[];
  topIncome:  { id: number; date: string; kind: string; category: string; description: string; amount: number }[];
  transactions: { id: number; date: string; kind: string; category: string; description: string; amount: number }[];
};

function fetchReportData(
  db: Database.Database,
  userId: number,
  opts: { month?: string; from?: string; to?: string; topN?: number; }
): ReportPack {

  const expHas = (c: string) => hasCol(db, 'expenses', c);
  const catHas = (c: string) => hasCol(db, 'categories', c);

  const dateCol =
    (expHas('date') && 'e.date') ||
    (expHas('spent_at') && 'e.spent_at') ||
    (expHas('created_at') && 'e.created_at') ||
    `' '`; // fallback

  const amountCol =
    (expHas('amount') && 'e.amount') ||
    (expHas('value') && 'e.value') ||
    '0';

  const descCol = expHas('description') ? 'e.description' : (expHas('note') ? 'e.note' : `''`);
  const kindCol = expHas('kind') ? 'e.kind' : `''`;
  const catIdCol = expHas('category_id') ? 'e.category_id' : 'NULL';

  const joinCat = expHas('category_id')
    ? `LEFT JOIN categories c ON c.id = e.category_id`
    : `LEFT JOIN categories c ON 1=0`;

  //  where chung cho totals/daily/categories
  const where: string[] = ['1=1'];
  const p: any[] = [];
  if (expHas('user_id')) { where.push('e.user_id = ?'); p.push(userId); }

  if (opts.from) { where.push(`${dateCol} >= ?`); p.push(opts.from); }
  if (opts.to)   { where.push(`${dateCol} <= ?`); p.push(opts.to); }

  if (!opts.from && !opts.to) {
    const m = opts.month || new Date().toISOString().slice(0, 7);
    where.push(`substr(${dateCol},1,7) = ?`);
    p.push(m);
  }

  // totals & stats
  const totalsSql = `
    SELECT
      COALESCE(SUM(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS totalExpense,
      COALESCE(SUM(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS totalIncome,
      COUNT(*) AS txCount,
      COALESCE(AVG(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS avgExpense,
      COALESCE(AVG(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS avgIncome,
      COALESCE(MAX(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS maxExpense,
      COALESCE(MIN(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS minExpense,
      COALESCE(MAX(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS maxIncome,
      COALESCE(MIN(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS minIncome
    FROM expenses e
    WHERE ${where.join(' AND ')}
  `;
  const t = db.prepare(totalsSql).get(...p) as any;

  // daily 
  const dailySql = `
    SELECT substr(${dateCol},1,10) AS day,
      COALESCE(SUM(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS expense,
      COALESCE(SUM(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS income
    FROM expenses e
    WHERE ${where.join(' AND ')}
    GROUP BY substr(${dateCol},1,10)
    ORDER BY day ASC
  `;
  const daily = (db.prepare(dailySql).all(...p) as any[]) || [];

  //categories 
  const catNameSel = catHas('name') ? 'c.name' : `'Khác'`;
  const catSql = `
    SELECT
      COALESCE(${catIdCol}, 0) AS id,
      ${catNameSel} AS name,
      COALESCE(SUM(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS expense,
      COALESCE(SUM(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS income
    FROM expenses e
    ${joinCat}
    WHERE ${where.join(' AND ')}
    GROUP BY COALESCE(${catIdCol},0), ${catNameSel}
    HAVING (expense + income) > 0
    ORDER BY (expense + income) DESC, name ASC
  `;
  const categories = (db.prepare(catSql).all(...p) as any[]) || [];

  const topN = Math.max(3, Math.min(50, opts.topN ?? 10));
  // top transactions (mỗi loại) 
  const txTopSql = `
    SELECT
      e.id AS id,
      ${dateCol} AS date,
      ${kindCol} AS kind,
      COALESCE(${amountCol}, 0) AS amount,
      ${descCol} AS description,
      ${catHas('name') ? 'c.name' : `' '`} AS category
    FROM expenses e
    ${joinCat}
    WHERE ${where.join(' AND ')} AND ${kindCol} = ?
    ORDER BY amount DESC
    LIMIT ?
  `;
  const topExpense = (db.prepare(txTopSql).all(...p, 'expense', topN) as any[]) || [];
  const topIncome  = (db.prepare(txTopSql).all(...p, 'income',  topN) as any[]) || [];

  // all transactions 
  const txAllSql = `
    SELECT
      e.id AS id,
      ${dateCol} AS date,
      ${kindCol} AS kind,
      COALESCE(${amountCol}, 0) AS amount,
      ${descCol} AS description,
      ${catHas('name') ? 'c.name' : `' '`} AS category
    FROM expenses e
    ${joinCat}
    WHERE ${where.join(' AND ')}
    ORDER BY date ASC, id ASC
  `;
  const transactions = (db.prepare(txAllSql).all(...p) as any[]) || [];

  // monthly trend: luôn lấy 3 tháng gần
  const baseMonth = opts.month || new Date().toISOString().slice(0, 7);
  const m2 = prevMonthStr(baseMonth, 2);
  const m1 = prevMonthStr(baseMonth, 1);
  const m0 = baseMonth;

  const monthlyTrendSql = `
    SELECT substr(${dateCol},1,7) AS month,
      COALESCE(SUM(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS expense,
      COALESCE(SUM(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS income
    FROM expenses e
    WHERE ${expHas('user_id') ? 'e.user_id = ? AND ' : ''} substr(${dateCol},1,7) IN (?, ?, ?)
    GROUP BY substr(${dateCol},1,7)
  `;
  const monthlyParams: any[] = [];
  if (expHas('user_id')) monthlyParams.push(userId);
  monthlyParams.push(m2, m1, m0);
  const rawMonthly = (db.prepare(monthlyTrendSql).all(...monthlyParams) as any[]) || [];
  // đảm bảo thứ tự m2 → m1 → m0, các tháng thiếu dữ liệu vẫn xuất 0
  const monthlyMap = new Map(rawMonthly.map(r => [r.month, r]));
  const monthly = [m2, m1, m0].map(m => ({
    month: m,
    expense: Number(monthlyMap.get(m)?.expense || 0),
    income: Number(monthlyMap.get(m)?.income || 0),
  }));

  const periodText = opts.from && opts.to
    ? `${opts.from} → ${opts.to}`
    : (opts.month || new Date().toISOString().slice(0,7));

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      periodText,
      userId,
      monthForTrend: baseMonth,
    },
    totals: {
      totalExpense: Number(t.totalExpense || 0),
      totalIncome: Number(t.totalIncome || 0),
      diff: Number(t.totalIncome || 0) - Number(t.totalExpense || 0),
      txCount: Number(t.txCount || 0),
      avgExpense: Number(t.avgExpense || 0),
      avgIncome: Number(t.avgIncome || 0),
      maxExpense: Number(t.maxExpense || 0),
      minExpense: Number(t.minExpense || 0),
      maxIncome: Number(t.maxIncome || 0),
      minIncome: Number(t.minIncome || 0),
    },
    monthly,
    daily,
    categories,
    topExpense,
    topIncome,
    transactions,
  };
}

// PDF helpers (cards/tables/charts)
function drawCard(doc: any, x: number, y: number, w: number, h: number, title: string, value: string, color: string) {
  doc.save();
  doc.roundedRect(x, y, w, h, 8).fillOpacity(0.06).fill(color).fillOpacity(1);
  doc.fillColor('#111').font('Inter').fontSize(10).text(title, x + 12, y + 10);
  doc.fillColor(color).font('Inter-Bold').fontSize(14).text(value, x + 12, y + 28);
  doc.restore();
}
function drawTable(
  doc: any,
  x: number,
  y: number,
  tableWidth: number,
  headers: { title: string; width: number; align?: 'left'|'center'|'right' }[],
  rows: (string | number)[][],
  zebra = true
) {
  const rowH = 18;
  doc.fillColor('#f3f4f6').roundedRect(x, y, tableWidth, 20, 4).fill();
  doc.fillColor('#111').font('Inter-Bold').fontSize(10);
  let cx = x + 8;
  headers.forEach(h => {
    doc.text(h.title, cx, y + 5, { width: h.width - 8, align: h.align || 'left' });
    cx += h.width;
  });
  let ry = y + 22;
  doc.font('Inter').fontSize(10).fillColor('#111');
  rows.forEach((r, i) => {
    if (zebra && i % 2 === 0) { doc.fillColor('#fafafa').roundedRect(x, ry, tableWidth, rowH, 2).fill(); doc.fillColor('#111'); }
    cx = x + 8;
    r.forEach((cell, j) => {
      const align = headers[j].align || 'left';
      doc.text(String(cell ?? ''), cx, ry + 3, { width: headers[j].width - 8, align });
      cx += headers[j].width;
    });
    ry += rowH;
    if (ry > 780) { doc.addPage(); ry = 40; }
  });
  return ry;
}
// Legends 
function drawLegend(doc: any, items: { name: string; color: string }[], x: number, y: number) {
  let cx = x;
  const box = 10;
  items.forEach((it) => {
    doc.rect(cx, y, box, box).fillColor(it.color).fill();
    doc.fillColor('#111').font('Inter').fontSize(9).text(it.name, cx + box + 6, y - 1);
    cx += box + 6 + Math.max(36, doc.widthOfString(it.name) + 10);
  });
}
// Grouped Bar Chart (monthly) 
function drawBarChart(doc: any, {
  x, y, w, h,
  categories,
  series,
  maxY,
}: {
  x: number; y: number; w: number; h: number;
  categories: string[];
  series: { name: string; color: string; data: number[] }[];
  maxY?: number;
}) {
  const padL = 36, padB = 28, padT = 10, padR = 10;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const innerX = x + padL;
  const innerY = y + padT;

  const maxVal = maxY ?? Math.max(1, ...series.flatMap(s => s.data));
  const yTicks = 4;
  const step = maxVal / yTicks;

  doc.strokeColor('#e5e7eb').lineWidth(1);
  for (let i = 0; i <= yTicks; i++) {
    const yy = innerY + ch - (i / yTicks) * ch;
    doc.moveTo(innerX, yy).lineTo(innerX + cw, yy).stroke();
    const label = Math.round(i * step);
    doc.fillColor('#6b7280').font('Inter').fontSize(8)
      .text(label.toLocaleString('vi-VN'), x + 2, yy - 5, { width: padL - 4, align: 'right' });
  }

  const groupW = cw / Math.max(1, categories.length);
  const gapG = 10;
  const barW = (groupW - gapG) / Math.max(1, series.length);

  categories.forEach((cat, i) => {
    const baseX = innerX + i * groupW + gapG / 2;
    series.forEach((s, si) => {
      const val = s.data[i] || 0;
      const bh = Math.max(0, (val / maxVal) * ch);
      const bx = baseX + si * barW;
      const by = innerY + ch - bh;
      doc.fillColor(s.color).roundedRect(bx, by, Math.max(0, barW - 2), bh, 2).fill();
    });
    doc.fillColor('#374151').font('Inter').fontSize(9)
      .text(cat, baseX, innerY + ch + 6, { width: groupW - gapG, align: 'center' });
  });
}
// Line Chart (daily) 
function drawLineChart(doc: any, {
  x, y, w, h,
  xLabels,
  series,
  maxY,
}: {
  x: number; y: number; w: number; h: number;
  xLabels: string[];
  series: { name: string; color: string; data: number[] }[];
  maxY?: number;
}) {
  const padL = 36, padB = 28, padT = 10, padR = 10;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const innerX = x + padL;
  const innerY = y + padT;

  const maxVal = maxY ?? Math.max(1, ...series.flatMap(s => s.data));
  const yTicks = 4;
  const step = maxVal / yTicks;

  doc.strokeColor('#e5e7eb').lineWidth(1);
  for (let i = 0; i <= yTicks; i++) {
    const yy = innerY + ch - (i / yTicks) * ch;
    doc.moveTo(innerX, yy).lineTo(innerX + cw, yy).stroke();
    const label = Math.round(i * step);
    doc.fillColor('#6b7280').font('Inter').fontSize(8)
      .text(label.toLocaleString('vi-VN'), x + 2, yy - 5, { width: padL - 4, align: 'right' });
  }

  const stride = Math.ceil(xLabels.length / 8);
  for (let i = 0; i < xLabels.length; i += stride) {
    const xx = innerX + (i / Math.max(1, xLabels.length - 1)) * cw;
    doc.fillColor('#374151').font('Inter').fontSize(8)
      .text(xLabels[i], xx - 10, innerY + ch + 6, { width: 20, align: 'center' });
  }

  series.forEach((s) => {
    doc.save().lineWidth(1.8).strokeColor(s.color);
    for (let i = 0; i < s.data.length; i++) {
      const val = s.data[i] || 0;
      const xx = innerX + (i / Math.max(1, s.data.length - 1)) * cw;
      const yy = innerY + ch - (val / maxVal) * ch;
      if (i === 0) doc.moveTo(xx, yy); else doc.lineTo(xx, yy);
    }
    doc.stroke().restore();

    s.data.forEach((val, i) => {
      const xx = innerX + (i / Math.max(1, s.data.length - 1)) * cw;
      const yy = innerY + ch - (val / maxVal) * ch;
      doc.circle(xx, yy, 1.6).fillColor(s.color).fill();
    });
  });
}

// Pie chart helpers
function drawArcPolyline(doc: any, cx: number, cy: number, r: number, startRad: number, endRad: number, steps = 28) {
  const sweep = endRad - startRad;
  for (let i = 0; i <= steps; i++) {
    const t = startRad + (sweep * i) / steps;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    doc.lineTo(x, y);
  }
}
function fillSector(doc: any, cx: number, cy: number, r: number, startRad: number, endRad: number, color: string) {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(cx, cy);
  drawArcPolyline(doc, cx, cy, r, startRad, endRad, 28);
  doc.lineTo(cx, cy).closePath().fill();
  doc.restore();
}
function drawPieSectors(
  doc: any,
  cx: number,
  cy: number,
  r: number,
  slices: { value:number; color:string }[]
) {
  const total = slices.reduce((s,v)=> s + Math.max(0, v.value), 0) || 1;
  let start = -Math.PI / 2;
  slices.forEach(s => {
    const angle = (Math.max(0, s.value) / total) * Math.PI * 2;
    const end = start + angle;
    fillSector(doc, cx, cy, r, start, end, s.color);
    start = end;
  });
}

// Handler ================= 
export async function POST(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();

    const body = (await req.json()) as ExportBody;
    const format = body.format;
    const kind = body.kind ?? 'both';
    const topN = Math.max(3, Math.min(50, body.topN ?? 10));

    const dbPath = path.join(process.cwd(), 'database', 'app.sqlite');
    const db = new Database(dbPath);

    const pack = fetchReportData(db, USER_ID, {
      month: body.month,
      from: body.from,
      to: body.to,
      topN,
    });

    // CSV
    if (format === 'csv') {
      const rows: string[] = [];
      const BOM = '\uFEFF';

      rows.push(`=== ${APP_NAME} Report (${REPORT_VERSION}) ===`);
      rows.push(`Generated At,${csvSafe(pack.meta.generatedAt)}`);
      rows.push(`Period,${csvSafe(pack.meta.periodText)}`);
      rows.push(`User ID,${pack.meta.userId}`);
      rows.push('');

      rows.push('=== SUMMARY ===');
      rows.push(`Total Expense,${pack.totals.totalExpense}`);
      rows.push(`Total Income,${pack.totals.totalIncome}`);
      rows.push(`Difference,${pack.totals.diff}`);
      rows.push(`Transactions,${pack.totals.txCount}`);
      rows.push(`Avg Expense,${pack.totals.avgExpense}`);
      rows.push(`Avg Income,${pack.totals.avgIncome}`);
      rows.push(`Max Expense,${pack.totals.maxExpense}`);
      rows.push(`Min Expense,${pack.totals.minExpense}`);
      rows.push(`Max Income,${pack.totals.maxIncome}`);
      rows.push(`Min Income,${pack.totals.minIncome}`);
      rows.push('');

      rows.push('=== MONTHLY (last 3, near export month) ===');
      rows.push('Month,Expense,Income');
      for (const m of pack.monthly) rows.push(`${m.month},${m.expense},${m.income}`);
      rows.push('');

      rows.push('=== DAILY BREAKDOWN ===');
      rows.push('Date,Expense,Income');
      for (const d of pack.daily) rows.push(`${d.day},${d.expense},${d.income}`);
      rows.push('');

      rows.push('=== CATEGORIES (EXPENSE) ===');
      rows.push('Category,Expense,Percent');
      const totExp = pack.totals.totalExpense || 0;
      for (const c of pack.categories) {
        const val = c.expense || 0;
        const pct = totExp > 0 ? (val / totExp) * 100 : 0;
        rows.push(`${csvSafe(c.name)},${val},${pct.toFixed(2)}%`);
      }
      rows.push('');

      rows.push('=== CATEGORIES (INCOME) ===');
      rows.push('Category,Income,Percent');
      const totInc = pack.totals.totalIncome || 0;
      for (const c of pack.categories) {
        const val = c.income || 0;
        const pct = totInc > 0 ? (val / totInc) * 100 : 0;
        rows.push(`${csvSafe(c.name)},${val},${pct.toFixed(2)}%`);
      }
      rows.push('');

      rows.push(`=== TOP ${pack.topExpense.length} TRANSACTIONS (EXPENSE) ===`);
      rows.push('ID,Date,Kind,Category,Description,Amount');
      for (const t of pack.topExpense) {
        rows.push([t.id, t.date, 'expense', csvSafe(t.category), csvSafe(t.description), t.amount].join(','));
      }
      rows.push('');

      rows.push(`=== TOP ${pack.topIncome.length} TRANSACTIONS (INCOME) ===`);
      rows.push('ID,Date,Kind,Category,Description,Amount');
      for (const t of pack.topIncome) {
        rows.push([t.id, t.date, 'income', csvSafe(t.category), csvSafe(t.description), t.amount].join(','));
      }
      rows.push('');

      rows.push('=== TRANSACTIONS (ALL) ===');
      rows.push('ID,Date,Kind,Category,Description,Amount');
      for (const t of pack.transactions) {
        rows.push([t.id, t.date, t.kind, csvSafe(t.category), csvSafe(t.description), t.amount].join(','));
      }

      const csv = BOM + rows.join('\n');
      const fileName = body.month
        ? `report-${body.month}-${kind}.csv`
        : `report-${pack.meta.periodText.replace(/\s|:|>/g,'_')}-${kind}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    //EXCEL
    if (format === 'excel') {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const metaSheet = XLSX.utils.aoa_to_sheet([
        [`${APP_NAME} Report (${REPORT_VERSION})`],
        ['Generated At', pack.meta.generatedAt],
        ['Period', pack.meta.periodText],
        ['User ID', pack.meta.userId],
        ['Trend Month', pack.meta.monthForTrend],
      ]);
      XLSX.utils.book_append_sheet(wb, metaSheet, 'Meta');

      const summarySheet = XLSX.utils.json_to_sheet([{
        TotalExpense: pack.totals.totalExpense,
        TotalIncome: pack.totals.totalIncome,
        Difference: pack.totals.diff,
        Transactions: pack.totals.txCount,
        AvgExpense: pack.totals.avgExpense,
        AvgIncome: pack.totals.avgIncome,
        MaxExpense: pack.totals.maxExpense,
        MinExpense: pack.totals.minExpense,
        MaxIncome: pack.totals.maxIncome,
        MinIncome: pack.totals.minIncome,
      }]);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      const monthlySheet = XLSX.utils.json_to_sheet(pack.monthly);
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly(3)');

      const dailySheet = XLSX.utils.json_to_sheet(pack.daily);
      XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily');

      const categoriesSheet = XLSX.utils.json_to_sheet(pack.categories);
      XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Categories');

      const topExpSheet = XLSX.utils.json_to_sheet(pack.topExpense);
      XLSX.utils.book_append_sheet(wb, topExpSheet, 'TopExpense');

      const topIncSheet = XLSX.utils.json_to_sheet(pack.topIncome);
      XLSX.utils.book_append_sheet(wb, topIncSheet, 'TopIncome');

      const txSheet = XLSX.utils.json_to_sheet(pack.transactions);
      XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      const uint8 = new Uint8Array(buf);

      const fileName = body.month
        ? `report-${body.month}-${kind}.xlsx`
        : `report-${pack.meta.periodText.replace(/\s|:|>/g,'_')}-${kind}.xlsx`;

      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // PDF
    if (format === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;

      const regularPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
      const boldPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf');
      if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
        return NextResponse.json(
          { ok: false, message: 'Thiếu font Inter. Hãy đặt Inter-Regular.ttf và Inter-Bold.ttf trong /public/fonts/' },
          { status: 500 }
        );
      }

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      const done = new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      doc.registerFont('Inter', fs.readFileSync(regularPath));
      doc.registerFont('Inter-Bold', fs.readFileSync(boldPath));
      doc.font('Inter');

      // Header
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 28, { width: 36 });
      doc.fillColor('#111').font('Inter-Bold').fontSize(18).text(`${APP_NAME} – Báo cáo`, 84, 28);
      doc.font('Inter').fontSize(10).fillColor('#666')
        .text(new Date().toLocaleString('vi-VN'), 40, 30, { align: 'right' });
      doc.moveTo(40, 66).lineTo(555, 66).strokeColor('#e5e7eb').stroke();

      // Meta line
      doc.moveDown(1.2);
      doc.font('Inter').fontSize(11).fillColor('#111')
        .text(`Kỳ: ${pack.meta.periodText}   •   Chế độ: Cả Thu & Chi   •   User #${pack.meta.userId}`);

      // KPI cards
      const y0 = doc.y + 8;
      const cards = [
        { title: 'Tổng chi', value: fmtVND(pack.totals.totalExpense) + ' đ', color: '#ef4444' },
        { title: 'Tổng thu', value: fmtVND(pack.totals.totalIncome) + ' đ', color: '#10b981' },
        { title: 'Chênh lệch', value: fmtVND(pack.totals.diff) + ' đ', color: '#3b82f6' },
        { title: 'Giao dịch', value: String(pack.totals.txCount), color: '#6366f1' },
      ];
      const w = 120, h = 56, gap = 12, x0 = 40;
      cards.forEach((c, i) => drawCard(doc, x0 + i * (w + gap), y0, w, h, c.title, c.value, c.color));
      doc.y = y0 + h + 18;

      // Monthly Bar Chart (3 tháng gần tháng xuất báo cáo)
      {
        const chartW = 515, chartH = 140, cx = 40, cy = doc.y;
        doc.font('Inter-Bold').fontSize(12).fillColor('#111').text('Xu hướng theo tháng (3 kỳ gần nhất)', cx, cy);
        const cats = pack.monthly.map(m => m.month);
        const sExpense = pack.monthly.map(m => m.expense);
        const sIncome  = pack.monthly.map(m => m.income);
        drawLegend(doc, [
          { name: 'Chi', color: '#ef4444' },
          { name: 'Thu', color: '#10b981' },
        ], cx, cy + 16);
        drawBarChart(doc, {
          x: cx, y: cy + 30, w: chartW, h: chartH,
          categories: cats,
          series: [
            { name: 'Chi', color: '#ef4444', data: sExpense },
            { name: 'Thu', color: '#10b981', data: sIncome  },
          ]
        });
        doc.y = cy + chartH + 42;
      }

      // Daily Line Chart
      {
        const chartW = 515, chartH = 160, cx = 40, cy = doc.y + 6;
        if (cy + chartH > 780) { doc.addPage(); }
        const cy2 = doc.y;
        doc.font('Inter-Bold').fontSize(12).fillColor('#111').text('Diễn biến theo ngày', cx, cy2);
        const xLabels = pack.daily.map(d => d.day.slice(8,10));
        const dExpense = pack.daily.map(d => d.expense);
        const dIncome  = pack.daily.map(d => d.income);
        drawLegend(doc, [
          { name: 'Chi', color: '#ef4444' },
          { name: 'Thu', color: '#10b981' },
        ], cx, cy2 + 16);
        drawLineChart(doc, {
          x: cx, y: cy2 + 30, w: chartW, h: chartH,
          xLabels,
          series: [
            { name: 'Chi', color: '#ef4444', data: dExpense },
            { name: 'Thu', color: '#10b981', data: dIncome  },
          ]
        });
        doc.y = cy2 + chartH + 46;
      }

      //Pie Charts (Thu/Chi theo danh mục)
      {
        if (doc.y > 680) doc.addPage();
        const sectionY = doc.y;
        doc.font('Inter-Bold').fontSize(12).fillColor('#111').text('Cơ cấu theo danh mục', 40, sectionY);
        const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#0ea5e9'];

        const incSlices = pack.categories
          .map((c,i)=> ({ label:c.name, value:Number(c.income||0), color: colors[i % colors.length] }))
          .filter(x=>x.value>0).sort((a,b)=> b.value - a.value).slice(0,8);

        const expSlices = pack.categories
          .map((c,i)=> ({ label:c.name, value:Number(c.expense||0), color: colors[i % colors.length] }))
          .filter(x=>x.value>0).sort((a,b)=> b.value - a.value).slice(0,8);

        const cx1 = 40 + 515 * 0.28;
        const cx2 = 40 + 515 * 0.72;
        const cy = sectionY + 70;
        const r = 52;

        drawPieSectors(doc, cx1, cy, r, incSlices.map(s=>({ value:s.value, color:s.color })));
        drawPieSectors(doc, cx2, cy, r, expSlices.map(s=>({ value:s.value, color:s.color })));

        doc.font('Inter').fontSize(10).fillColor('#111')
          .text('Thu', cx1 - 8, sectionY + 28)
          .text('Chi', cx2 - 8, sectionY + 28);

        // legends
        const renderLegend = (sx: number, sy: number, slices: {label:string; value:number; color:string}[]) => {
          let y = sy;
          slices.forEach(s => {
            doc.rect(sx, y, 8, 8).fillColor(s.color).fill();
            doc.fillColor('#111').font('Inter').fontSize(9)
              .text(`${s.label} (${fmtVND(s.value)} đ)`, sx + 12, y - 1, { width: 150, ellipsis: true });
            y += 12;
          });
        };
        renderLegend(40, sectionY + 140, incSlices.slice(0,6));
        renderLegend(40 + 515/2, sectionY + 140, expSlices.slice(0,6));

        doc.y = sectionY + 170;
      }

      // Categories table: EXPENSE
      {
        if (doc.y > 720) doc.addPage();
        doc.font('Inter-Bold').fontSize(12).fillColor('#111').text('Phân bổ theo danh mục – Chi', 40, doc.y);
        const totExp = pack.totals.totalExpense || 0;
        const rowsExp = pack.categories.map((c, idx) => {
          const v = c.expense || 0;
          const pct = totExp > 0 ? (v / totExp) * 100 : 0;
          return [idx + 1, c.name || 'Khác', `${fmtVND(v)} đ`, `${pct.toFixed(1)}%`];
        });
        const headers = [
          { title: '#', width: 28, align: 'center' as const },
          { title: 'Danh mục', width: 240, align: 'left' as const },
          { title: 'Giá trị', width: 160, align: 'right' as const },
          { title: '%', width: 70, align: 'right' as const },
        ];
        drawTable(doc, 40, doc.y + 12, 498, headers, rowsExp);
      }

      // Categories table: INCOME 
      {
        if (doc.y > 720) doc.addPage();
        doc.font('Inter-Bold').fontSize(12).fillColor('#111').text('Phân bổ theo danh mục – Thu', 40, doc.y);
        const totInc = pack.totals.totalIncome || 0;
        const rowsInc = pack.categories.map((c, idx) => {
          const v = c.income || 0;
          const pct = totInc > 0 ? (v / totInc) * 100 : 0;
          return [idx + 1, c.name || 'Khác', `${fmtVND(v)} đ`, `${pct.toFixed(1)}%`];
        });
        const headers = [
          { title: '#', width: 28, align: 'center' as const },
          { title: 'Danh mục', width: 240, align: 'left' as const },
          { title: 'Giá trị', width: 160, align: 'right' as const },
          { title: '%', width: 70, align: 'right' as const },
        ];
        drawTable(doc, 40, doc.y + 12, 498, headers, rowsInc);
      }

      //Top transactions: EXPENSE 
      if (doc.y > 720) doc.addPage();
      doc.font('Inter-Bold').fontSize(12).fillColor('#111')
        .text(`Top ${pack.topExpense.length} giao dịch (Chi)`, 40, doc.y + 8);
      const txTopRowsExp = pack.topExpense.map(t => [
        t.id, t.date, 'Chi', t.category || '', t.description || '', `${fmtVND(t.amount)} đ`
      ]);
      const txHeaders = [
        { title: 'ID', width: 38, align: 'left' as const },
        { title: 'Ngày', width: 92, align: 'left' as const },
        { title: 'Loại', width: 46, align: 'left' as const },
        { title: 'Danh mục', width: 130, align: 'left' as const },
        { title: 'Ghi chú', width: 132, align: 'left' as const },
        { title: 'Số tiền', width: 60, align: 'right' as const },
      ];
      drawTable(doc, 40, doc.y + 20, 498, txHeaders, txTopRowsExp);

      //Top transactions: INCOME 
      if (doc.y > 720) doc.addPage();
      doc.font('Inter-Bold').fontSize(12).fillColor('#111')
        .text(`Top ${pack.topIncome.length} giao dịch (Thu)`, 40, doc.y + 8);
      const txTopRowsInc = pack.topIncome.map(t => [
        t.id, t.date, 'Thu', t.category || '', t.description || '', `${fmtVND(t.amount)} đ`
      ]);
      drawTable(doc, 40, doc.y + 20, 498, txHeaders, txTopRowsInc);

      // Footer
      doc.font('Inter').fontSize(9).fillColor('#666');
      doc.text(`${APP_NAME} • ${REPORT_VERSION}`, 40, 812, { align: 'left' });
      doc.text(`© ${new Date().getFullYear()}`, 515, 812, { align: 'right' });

      doc.end();
      const buffer = await done;
      const uint8 = new Uint8Array(buffer);

      const fileName = body.month
        ? `report-${body.month}-${kind}.pdf`
        : `report-${pack.meta.periodText.replace(/\s|:|>/g,'_')}-${kind}.pdf`;

      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    return NextResponse.json({ ok: false, message: 'format không hợp lệ' }, { status: 400 });

  } catch (e: any) {
    console.error('[Export API] Fatal', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Export error' }, { status: 500 });
  }
}
