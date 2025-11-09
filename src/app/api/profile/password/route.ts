import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: number;
  password_hash: string;
};

export async function PUT(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();

    const body = (await req.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword?.trim() ?? "";
    const newPassword = body.newPassword?.trim() ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Lấy mật khẩu cũ từ DB
    const row = db
      .prepare<Row>("SELECT id, password_hash FROM users WHERE id = ? LIMIT 1")
      .get(USER_ID as any) as Row | undefined;

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "User không tồn tại" },
        { status: 404 }
      );
    }

    // Kiểm tra mật khẩu hiện tại
    const ok = await verifyPassword(currentPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "Mật khẩu hiện tại không đúng" },
        { status: 400 }
      );
    }

    // Hash mật khẩu mới
    const newHash = await hashPassword(newPassword);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      newHash,
      USER_ID
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PUT /api/profile/password]", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Lỗi đổi mật khẩu" },
      { status: 500 }
    );
  }
}
