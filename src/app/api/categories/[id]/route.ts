import { NextResponse } from "next/server";
import db, { row } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params.id);
    const body = await req.json();
    const { name, icon, color, sort_order } = body ?? {};

    if (name !== undefined && String(name).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "VALIDATION", message: "Tên danh mục không được để trống" },
        { status: 400 }
      );
    }

    if (name) {
      const dup = row<{ id: number }>(
        `SELECT id FROM categories WHERE user_id = ? AND lower(name) = lower(?) AND id <> ?`,
        [USER_ID, String(name).trim(), id]
      );
      if (dup) {
        return NextResponse.json(
          { ok: false, code: "DUPLICATE", message: "Danh mục đã tồn tại, vui lòng chọn tên khác" },
          { status: 409 }
        );
      }
    }

    db.prepare(
      `UPDATE categories SET
         name       = COALESCE(?, name),
         icon       = COALESCE(?, icon),
         color      = COALESCE(?, color),
         sort_order = COALESCE(?, sort_order)
       WHERE id = ? AND user_id = ?`
    ).run(name ?? null, icon ?? null, color ?? null, sort_order ?? null, id, USER_ID);

    const updated = row<any>("SELECT * FROM categories WHERE id = ? AND user_id = ?", [id, USER_ID]);
    if (!updated) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e: any) {
    console.error("[PUT /api/categories/:id] ", e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: USER_ID } = await requireUser();
    const id = Number(params.id);

    const usage = row<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM expenses WHERE user_id = ? AND category_id = ?",
      [USER_ID, id]
    );
    const usingCount = Number(usage?.cnt ?? 0);
    if (usingCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "HAS_DEPENDENCIES",
          count: usingCount,
          message: "Không thể xoá vì đang có khoản chi/thu dùng danh mục này.",
        },
        { status: 400 }
      );
    }

    const res = db
      .prepare("DELETE FROM categories WHERE id = ? AND user_id = ?")
      .run(id, USER_ID);

    if ((res?.changes ?? 0) === 0) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE /api/categories/:id] ", e);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
