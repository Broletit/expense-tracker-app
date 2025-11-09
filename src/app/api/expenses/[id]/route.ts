import { NextResponse } from 'next/server';
import db from '@/lib/db/client';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

function hasCol(table: string, col: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map(r => r.name)).has(col);
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

// PUT /api/expenses/:id (sửa) 
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const own = db.prepare(`SELECT id FROM expenses WHERE id=? AND user_id=?`).get(id, USER_ID);
    if (!own) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { category_id, amount, description, date, kind } = body ?? {};

    const sets: string[] = [];
    const vals: any[] = [];

    if (category_id !== undefined) { sets.push('category_id=?'); vals.push(category_id); }
    if (amount !== undefined)      { sets.push('amount=?');      vals.push(amount); }
    if (description !== undefined) { sets.push('description=?'); vals.push(description); }
    if (date !== undefined)        { sets.push('date=?');        vals.push(date); }
    if (kind !== undefined)        { sets.push('kind=?');        vals.push(kind); }

    if (hasCol('expenses', 'updated_at')) sets.push('updated_at=CURRENT_TIMESTAMP');
    if (!sets.length) return NextResponse.json({ error: 'No fields' }, { status: 400 });

    const sql = `UPDATE expenses SET ${sets.join(', ')} WHERE id=? AND user_id=?`;
    vals.push(id, USER_ID);
    db.prepare(sql).run(...vals);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[PUT /api/expenses/:id]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/expenses/:id (xoá) 
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const own = db.prepare(`SELECT id FROM expenses WHERE id=? AND user_id=?`).get(id, USER_ID);
    if (!own) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (hasCol('expenses', 'deleted_at')) {
      db.prepare(`UPDATE expenses SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).run(id, USER_ID);
    } else {
      db.prepare(`DELETE FROM expenses WHERE id=? AND user_id=?`).run(id, USER_ID);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[DELETE /api/expenses/:id]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
