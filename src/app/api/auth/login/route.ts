import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db/client";
import { setSessionUser } from "@/lib/auth/session";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Thiếu email/password" },
        { status: 400 }
      );
    }

    const row = db
      .prepare(
        `SELECT id, email, name, password_hash
         FROM users
         WHERE lower(email) = ?
         LIMIT 1`
      )
      .get(email) as UserRow | undefined;

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "Sai email hoặc mật khẩu" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "Sai email hoặc mật khẩu" },
        { status: 401 }
      );
    }

    //  Lưu session sau khi login thành công
    await setSessionUser({ id: row.id, email: row.email, name: row.name });

    return NextResponse.json({ ok: true, user: { id: row.id, email: row.email, name: row.name } });
  } catch (e: any) {
    console.error("[POST /api/auth/login]", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
