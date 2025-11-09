import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

type CurrentRow = {
  category_id: number | null;
  period: string;
  limit_amount: number;
  note: string | null;
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params.id);
    const body = await req.json();
    const {
      category_id,
      period,
      limit_amount,
      note,
    } = (body ?? {}) as {
      category_id?: number | null;
      period?: string;
      limit_amount?: number;
      note?: string | null;
    };

    const current = db
      .prepare(
        `SELECT category_id, period, limit_amount, note
         FROM budgets
         WHERE id = ? AND user_id = ?`
      )
      .get(id, USER_ID) as CurrentRow | undefined;

    if (!current) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }

    const nextCategoryId =
      typeof category_id !== "undefined" ? category_id : current.category_id;
    const nextPeriod = typeof period !== "undefined" ? String(period) : current.period;
    const nextLimit =
      typeof limit_amount !== "undefined" ? Number(limit_amount) : current.limit_amount;
    const nextNote = typeof note !== "undefined" ? note : current.note;

    const changingCategory = nextCategoryId !== current.category_id;

    if (changingCategory && nextCategoryId != null) {
      const dup = db
        .prepare(
          `SELECT id FROM budgets
           WHERE user_id = ? AND period = ? AND category_id = ? AND id <> ?`
        )
        .get(USER_ID, nextPeriod, Number(nextCategoryId), id);
      if (dup) {
        return NextResponse.json(
          { ok: false, message: "Duplicate category for this period" },
          { status: 409 }
        );
      }
    }

    const st = db
      .prepare(
        `UPDATE budgets
         SET category_id = ?, period = ?, limit_amount = ?, note = ?
         WHERE id = ? AND user_id = ?`
      )
      .run(nextCategoryId ?? null, nextPeriod, nextLimit, nextNote ?? null, id, USER_ID);

    if (!st.changes) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PUT /api/budgets/[id]]", e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params.id);
    const st = db.prepare(`DELETE FROM budgets WHERE id = ? AND user_id = ?`).run(id, USER_ID);
    if (!st.changes) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE /api/budgets/[id]]", e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
