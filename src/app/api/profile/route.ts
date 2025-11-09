import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
};

export async function GET() {
  try {
    const { id: USER_ID } = await requireUser();

    const row = db
      .prepare<UserRow>(
        `SELECT id, email, name, avatar
         FROM users
         WHERE id = ?
         LIMIT 1`
      )
      .get(USER_ID as any) as UserRow | undefined;

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "User không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: row.id,
        email: row.email,
        name: row.name,
        avatar: row.avatar,
      },
      {
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate, private",
          pragma: "no-cache",
          expires: "0",
        },
      }
    );
  } catch (e: any) {
    console.error("[GET /api/profile]", e);
    return NextResponse.json(
      { ok: false, message: "Không lấy được hồ sơ" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email không được để trống" },
        { status: 400 }
      );
    }

    // check trùng email user khác
    const dup = db
      .prepare(
        `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`
      )
      .get(email, USER_ID as any) as { id: number } | undefined;

    if (dup) {
      return NextResponse.json(
        { ok: false, message: "Email này đã được sử dụng bởi tài khoản khác" },
        { status: 400 }
      );
    }

    db.prepare(
      `UPDATE users
       SET name = ?, email = ?
       WHERE id = ?`
    ).run(name || null, email, USER_ID);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PUT /api/profile]", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Cập nhật hồ sơ thất bại" },
      { status: 500 }
    );
  }
}
