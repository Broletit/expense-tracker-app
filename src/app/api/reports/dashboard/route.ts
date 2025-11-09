import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database', 'app.sqlite'));
const USER_ID = 1;

function hasCol(table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

export async function GET(req: Request) {
  try {
    //  detect columns 
    const expHas = (c: string) => hasCol('expenses', c);
    const catHas = (c: string) => hasCol('categories', c);

    const dateCol   = expHas('date')      ? 'e.date'
                     : expHas('spent_at') ? 'e.spent_at'
                     : expHas('created_at') ? 'e.created_at'
                     : `' '`;

    const noteCol   = expHas('note')        ? 'e.note'
                     : expHas('description') ? 'e.description'
                     : expHas('content')     ? 'e.content'
                     : 'NULL';

    const amountCol = expHas('amount') ? 'e.amount'
                     : expHas('value') ? 'e.value'
                     : '0';

    const catNameSel = catHas('name')  ? 'c.name'  : 'NULL';
    const iconSel    = catHas('icon')  ? 'c.icon'  : 'NULL';
    const colorSel   = catHas('color') ? 'c.color' : 'NULL';

    //  build filters
    const url   = new URL(req.url);
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const from  = url.searchParams.get('from');
    const to    = url.searchParams.get('to');
    const limit = Number(url.searchParams.get('limit') ?? 10);

    const where: string[] = ['e.user_id = ?'];
    const params: any[] = [USER_ID];

    if (from) where.push(`${dateCol} >= ?`), params.push(from);
    if (to)   where.push(`${dateCol} <= ?`), params.push(to);
    if (!from && !to && month) where.push(`substr(${dateCol},1,7) = ?`), params.push(month);

    //  totals
    const statsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN e.kind='expense' THEN ${amountCol} END),0) AS totalExpense,
        COALESCE(SUM(CASE WHEN e.kind='income'  THEN ${amountCol} END),0) AS totalIncome,
        COALESCE(MAX(CASE WHEN e.kind='expense' THEN ${amountCol} END),0) AS maxExpense
      FROM expenses e
      WHERE ${where.join(' AND ')}
    `;
    const stats = db.prepare(statsSql).get(...params) as {
      totalExpense: number; totalIncome: number; maxExpense: number;
    };

    //  recent (thu + chi)
    const recentSql = `
      SELECT
        e.id,
        ${dateCol}    AS date,
        e.kind,
        ${amountCol}  AS amount,
        ${noteCol}    AS description,
        ${catNameSel} AS categoryName,
        ${iconSel}    AS icon,
        ${colorSel}   AS color
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${dateCol} DESC, e.id DESC
      LIMIT ?
    `;
    const recent = db.prepare(recentSql).all(...params, limit) as any[];

    return NextResponse.json({
      ok: true,
      data: {
        totalExpense: stats?.totalExpense ?? 0,
        totalIncome : stats?.totalIncome  ?? 0,
        diff        : (stats?.totalIncome ?? 0) - (stats?.totalExpense ?? 0),
        maxExpense  : stats?.maxExpense   ?? 0,
        recent,
      },
    });
  } catch (e: any) {
    console.error('[GET /api/reports/dashboard]', e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
