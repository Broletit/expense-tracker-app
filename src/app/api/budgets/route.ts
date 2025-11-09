import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

type Row = {
  id: number;
  user_id: number;
  category_id: number;
  period: string;           
  limit_amount: number;
  note: string | null;
};

//GET: danh sách budgets theo period 
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  if (!period) {
    return NextResponse.json({ error: "Missing period" }, { status: 400 });
  }

  const { id: USER_ID } = await requireUser();

  const stmt = db.prepare<Row>(`
    SELECT b.id, b.user_id, b.category_id, b.period, b.limit_amount, b.note
    FROM budgets b
    WHERE b.user_id = ? AND b.period = ?
    ORDER BY b.category_id
  `);

  const items = stmt.all([USER_ID, period] as any) as Row[];

  const mapped = items.map((x) => ({
    id: x.id,
    categoryId: x.category_id,
    period: x.period,
    limit_amount: Number(x.limit_amount),
    note: x.note,
  }));

  return NextResponse.json({ items: mapped });
}

// POST: tạo ngân sách 
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id: USER_ID } = await requireUser();

  const {
    categoryId,
    period,
    limit_amount,
    note = null,
  } = body ?? {};

  if (categoryId == null) {
    return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
  }
  if (!period) {
    return NextResponse.json({ error: "Missing period" }, { status: 400 });
  }
  if (limit_amount == null) {
    return NextResponse.json(
      { error: "Missing limit_amount" },
      { status: 400 },
    );
  }
  if (Number(limit_amount) < 0) {
    return NextResponse.json(
      { error: "limit_amount must be >= 0" },
      { status: 400 },
    );
  }

  const dup = db
    .prepare(
      `SELECT 1 FROM budgets 
       WHERE user_id=? AND period=? AND category_id=? LIMIT 1`,
    )
    .get([USER_ID, period, categoryId]);
  if (dup) {
    return NextResponse.json(
      { error: "Duplicate category for this period" },
      { status: 409 },
    );
  }

  const ins = db.prepare(`
    INSERT INTO budgets (user_id, category_id, period, limit_amount, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = ins.run([USER_ID, categoryId, period, limit_amount, note]);
  return NextResponse.json(
    { id: Number(info.lastInsertRowid) },
    { status: 201 },
  );
}
// PATCH: cập nhật ngân sách theo id 
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { id: USER_ID } = await requireUser();

  const row = db
    .prepare<Row>(`SELECT * FROM budgets WHERE id=? AND user_id=?`)
    .get([id, USER_ID] as any) as Row | undefined;
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const up: Partial<
    Pick<Row, "category_id" | "period" | "limit_amount" | "note">
  > = {};
  if ("categoryId" in body) up.category_id = body.categoryId;
  if ("period" in body) up.period = body.period;
  if ("limit_amount" in body) up.limit_amount = body.limit_amount;
  if ("note" in body) up.note = body.note;

  const nextCategoryId = up.category_id ?? row.category_id;
  const nextPeriod = up.period ?? row.period;

  const dup = db
    .prepare(
      `SELECT 1 FROM budgets 
       WHERE user_id=? AND period=? AND category_id=? AND id<>? LIMIT 1`,
    )
    .get([USER_ID, nextPeriod, nextCategoryId, id]);
  if (dup) {
    return NextResponse.json(
      { error: "Duplicate category for this period" },
      { status: 409 },
    );
  }

  const fields: string[] = [];
  const params: any[] = [];
  if (up.category_id !== undefined) {
    fields.push("category_id=?");
    params.push(up.category_id);
  }
  if (up.period !== undefined) {
    fields.push("period=?");
    params.push(up.period);
  }
  if (up.limit_amount !== undefined) {
    if (Number(up.limit_amount) < 0) {
      return NextResponse.json(
        { error: "limit_amount must be >= 0" },
        { status: 400 },
      );
    }
    fields.push("limit_amount=?");
    params.push(up.limit_amount);
  }
  if (up.note !== undefined) {
    fields.push("note=?");
    params.push(up.note);
  }

  if (!fields.length) return NextResponse.json({ ok: true });

  const sql = `UPDATE budgets SET ${fields.join(
    ", ",
  )} WHERE id=? AND user_id=?`;
  params.push(id, USER_ID);
  db.prepare(sql).run(params);

  return NextResponse.json({ ok: true });
}

// DELETE: xoá ngân sách theo id 
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { id: USER_ID } = await requireUser();

  const st = db
    .prepare(`DELETE FROM budgets WHERE id=? AND user_id=?`)
    .run([id, USER_ID]);
  if (!st.changes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
