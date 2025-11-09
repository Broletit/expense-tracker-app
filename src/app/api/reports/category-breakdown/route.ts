import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { requireUser } from '@/lib/auth/session';

const db = new Database(path.join(process.cwd(), 'database', 'app.sqlite'));

function hasCol(table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const url = new URL(req.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const kindParam = (url.searchParams.get('kind') ?? '').trim(); // 'expense' | 'income' | ''

    const dateCol   = hasCol('expenses', 'date')       ? 'e.date'
                    : hasCol('expenses', 'spent_at')   ? 'e.spent_at'
                    : hasCol('expenses', 'created_at') ? 'e.created_at'
                    : `' '`;

    const amountCol = hasCol('expenses', 'amount') ? 'e.amount'
                    : hasCol('expenses', 'value')  ? 'e.value'
                    : '0';

    const hasUserId   = hasCol('expenses', 'user_id');
    const hasCatId    = hasCol('expenses', 'category_id');
    const catNameSel  = hasCol('categories', 'name') ? 'c.name' : `'Khác'`;

    const where: string[] = [];
    const params: any[] = [];

    if (hasUserId) { where.push(`e.user_id = ?`); params.push(USER_ID); }
    where.push(`substr(${dateCol},1,7) = ?`); params.push(month);

    const joinCat = hasCatId ? `LEFT JOIN categories c ON c.id = e.category_id` : `LEFT JOIN categories c ON 1=0`;

    const sql = `
      SELECT
        COALESCE(e.category_id, 0) AS id,
        ${catNameSel} AS name,
        COALESCE(SUM(CASE WHEN e.kind='expense' THEN ${amountCol} END),0) AS expense,
        COALESCE(SUM(CASE WHEN e.kind='income'  THEN ${amountCol} END),0) AS income
      FROM expenses e
      ${joinCat}
      WHERE ${where.join(' AND ')}
      GROUP BY COALESCE(e.category_id,0), ${catNameSel}
      HAVING (expense + income) > 0
      ORDER BY ${kindParam === 'income' ? 'income' : kindParam === 'expense' ? 'expense' : '(expense+income)'} DESC
    `;
    const rows = db.prepare(sql).all(...params);
    const normalized = rows.map((r: any) => ({
      id: r.id ?? 0,
      name: (r.name && String(r.name).trim()) || 'Khác',
      expense: Number(r.expense) || 0,
      income: Number(r.income) || 0,
    }));

    return NextResponse.json({ ok: true, data: normalized });
  } catch (e: any) {
    console.error('[GET /api/reports/category-breakdown]', e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
