import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { requireUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasCol(db: Database.Database, table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';
    const from  = searchParams.get('from')  || '';
    const to    = searchParams.get('to')    || '';
    const kind  = (searchParams.get('kind') || 'expense').toLowerCase();
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 10)));

    if (kind !== 'expense' && kind !== 'income') {
      return NextResponse.json({ ok: false, message: 'kind phải là expense hoặc income' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'database', 'app.sqlite');
    const db = new Database(dbPath);

    const expHas = (c: string) => hasCol(db, 'expenses', c);
    const catHas = (c: string) => hasCol(db, 'categories', c);

    const dateCol =
      (expHas('date') && 'e.date') ||
      (expHas('spent_at') && 'e.spent_at') ||
      (expHas('created_at') && 'e.created_at') ||
      `' '`;

    const amountCol =
      (expHas('amount') && 'e.amount') ||
      (expHas('value') && 'e.value') ||
      '0';

    const descCol = expHas('description') ? 'e.description' : (expHas('note') ? 'e.note' : `''`);
    const kindCol = expHas('kind') ? 'e.kind' : `''`;

    const joinCat = expHas('category_id')
      ? `LEFT JOIN categories c ON c.id = e.category_id`
      : `LEFT JOIN categories c ON 1=0`;

    const where: string[] = ['1=1'];
    const p: any[] = [];

    if (expHas('user_id')) { where.push('e.user_id = ?'); p.push(USER_ID); }

    if (from) { where.push(`${dateCol} >= ?`); p.push(from); }
    if (to)   { where.push(`${dateCol} <= ?`); p.push(to); }

    if (!from && !to) {
      const m = month || new Date().toISOString().slice(0, 7);
      where.push(`substr(${dateCol},1,7) = ?`);
      p.push(m);
    }

    const sql = `
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
    const rows = db.prepare(sql).all(...p, kind, limit) as {
      id: number; date: string; kind: string; amount: number; description: string; category: string;
    }[];

    return NextResponse.json({ ok: true, data: rows }, { status: 200 });
  } catch (e: any) {
    console.error('[GET /api/reports/top-transactions] Error', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Query error' }, { status: 500 });
  }
}
