import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { requireUser } from '@/lib/auth/session';

const db = new Database(path.join(process.cwd(), 'database', 'app.sqlite'));

function cols() {
  const info = (t:string)=> new Set((db.prepare(`PRAGMA table_info(${t})`).all() as any[]).map(r=>r.name));
  const e = info('expenses');
  const date = e.has('date') ? 'e.date' : e.has('spent_at') ? 'e.spent_at' : e.has('created_at') ? 'e.created_at' : `' '`;
  const amt  = e.has('amount') ? 'e.amount' : e.has('value') ? 'e.value' : '0';
  const hasUserId = e.has('user_id');
  return { date, amt, hasUserId };
}

export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const { date, amt, hasUserId } = cols();
    const url = new URL(req.url);
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0,7);

    const where: string[] = [`substr(${date},1,7) = ?`, `${date} IS NOT NULL AND ${date} <> ''`];
    const params: any[] = [month];
    if (hasUserId) { where.push(`e.user_id = ?`); params.push(USER_ID); }

    const sql = `
      SELECT
        substr(${date},1,10) AS day,
        COALESCE(SUM(CASE WHEN e.kind='expense' THEN ${amt} END),0) AS expense,
        COALESCE(SUM(CASE WHEN e.kind='income'  THEN ${amt} END),0) AS income
      FROM expenses e
      WHERE ${where.join(' AND ')}
      GROUP BY substr(${date},1,10)
      ORDER BY day ASC
    `;
    const rows = db.prepare(sql).all(...params);
    return NextResponse.json({ ok: true, data: rows });
  } catch (e:any) {
    console.error('[GET /api/reports/daily-spending]', e);
    return NextResponse.json({ ok:false, message: e.message }, { status: 500 });
  }
}
