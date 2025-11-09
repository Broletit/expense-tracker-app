import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Thiếu file ảnh" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "File phải là ảnh (image/*)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const sharp = (await import("sharp")).default;

    const resized = await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .toFormat("png")
      .toBuffer();

    const base64 = resized.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(
      dataUrl,
      USER_ID
    );

    return NextResponse.json({ ok: true, avatar: dataUrl });
  } catch (e: any) {
    console.error("[POST /api/profile/avatar]", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Upload avatar thất bại" },
      { status: 500 }
    );
  }
}
