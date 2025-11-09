import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db/client";
import { setSessionUser } from "@/lib/auth/session";

type NewUserBody = {
  email?: string;
  name?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    // Parse body an toàn
    const body = (await req.json().catch(() => ({}))) as NewUserBody;

    const email = String(body.email ?? "").trim().toLowerCase();
    const name = body.name != null ? String(body.name).trim() : "";
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Thiếu email/password" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Mật khẩu tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    // Tạo user 
    const info = db
      .prepare(
        `INSERT INTO users (email, name, password_hash)
         VALUES (?, ?, ?)`
      )
      .run(email, name || null, hash);

    const user = {
      id: Number(info.lastInsertRowid),
      email,
      name: name || undefined,
    };

    //  Lưu session ngay sau khi đăng ký
    await setSessionUser(user);

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e: any) {
    const msg = String(e?.message || "");

    // Lỗi trùng email
    if (msg.toLowerCase().includes("unique") && msg.toLowerCase().includes("email")) {
      return NextResponse.json(
        { ok: false, message: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    console.error("[POST /api/auth/register]", e);
    return NextResponse.json(
      { ok: false, message: "Lỗi đăng ký" },
      { status: 500 }
    );
  }
}
