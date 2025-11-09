import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USER_ID = 1;

function hasCol(db: Database.Database, table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '';  
    const from  = searchParams.get('from')  || '';   
    const to    = searchParams.get('to')    || '';   

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

    const kindCol = expHas('kind') ? 'e.kind' : `''`;

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
        weekday(${dateCol}) AS wday, -- 0..6 (CN..T7)
        COALESCE(SUM(CASE WHEN ${kindCol}='income'  THEN ${amountCol} END),0) AS income,
        COALESCE(SUM(CASE WHEN ${kindCol}='expense' THEN ${amountCol} END),0) AS expense
      FROM expenses e
      WHERE ${where.join(' AND ')}
      GROUP BY weekday(${dateCol})
      ORDER BY wday ASC
    `;

    const rows = db.prepare(sql).all(...p) as { wday: number; income: number; expense: number }[];

    // Trả về đủ 7 ngày (0..6), nếu thiếu thì 0
    const map = new Map<number, { income:number; expense:number }>();
    rows.forEach(r => map.set(r.wday, { income: r.income || 0, expense: r.expense || 0 }));

    const data = Array.from({ length: 7 }, (_, w) => ({
      wday: w, 
      income: map.get(w)?.income || 0,
      expense: map.get(w)?.expense || 0,
    }));

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    console.error('[GET /api/reports/weekday-breakdown] Error', e);
    return NextResponse.json({ ok: false, message: e?.message || 'Query error' }, { status: 500 });
  }
}
