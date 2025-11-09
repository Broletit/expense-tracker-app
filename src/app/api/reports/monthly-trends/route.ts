import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { requireUser } from '@/lib/auth/session';

const db = new Database(path.join(process.cwd(), 'database', 'app.sqlite'));

function hasCol(table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

function decMonth(ym: string, offset: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m - 1) - offset, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const url   = new URL(req.url);
    const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 3));
    const monthParam = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const startMonth = decMonth(monthParam, limit - 1);

    const dateCol   = hasCol('expenses', 'date')       ? 'e.date'
                    : hasCol('expenses', 'spent_at')   ? 'e.spent_at'
                    : hasCol('expenses', 'created_at') ? 'e.created_at'
                    : `' '`;

    const amountCol = hasCol('expenses', 'amount') ? 'e.amount'
                    : hasCol('expenses', 'value')  ? 'e.value'
                    : '0';

    const hasUserId = hasCol('expenses', 'user_id');

    const where: string[] = [];
    const params: any[] = [];
    if (hasUserId) { where.push(`e.user_id = ?`); params.push(USER_ID); }
    where.push(`${dateCol} IS NOT NULL AND ${dateCol} <> ''`);
    where.push(`substr(${dateCol},1,7) BETWEEN ? AND ?`);
    params.push(startMonth, monthParam);

    const sql = `
      SELECT substr(${dateCol},1,7) AS month,
        COALESCE(SUM(CASE WHEN e.kind='expense' THEN ${amountCol} END),0) AS expense,
        COALESCE(SUM(CASE WHEN e.kind='income'  THEN ${amountCol} END),0) AS income
      FROM expenses e
      WHERE ${where.join(' AND ')}
      GROUP BY substr(${dateCol},1,7)
      ORDER BY month ASC
    `;
    const rows = db.prepare(sql).all(...params);
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    console.error('[GET /api/reports/monthly-trends]', e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
