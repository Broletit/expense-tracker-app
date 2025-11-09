import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import db from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, user: null },
        {
          headers: {
            "cache-control": "no-store, no-cache, must-revalidate, private",
            pragma: "no-cache",
            expires: "0",
          },
        }
      );
    }

    // Lấy user mới nhất từ DB 
    const row = db
      .prepare(
        `SELECT id, email, name, avatar
         FROM users
         WHERE id = ?
         LIMIT 1`
      )
      .get(session.user.id as number) as
      | { id: number; email: string; name: string | null; avatar: string | null }
      | undefined;

    const user = row
      ? {
          id: row.id,
          email: row.email,
          name: row.name,
          avatar: row.avatar,
        }
      : {
          id: session.user.id,
          email: session.user.email,
          name: (session.user as any).name ?? null,
          avatar: (session.user as any).avatar ?? null,
        };

    return NextResponse.json(
      { ok: true, user },
      {
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate, private",
          pragma: "no-cache",
          expires: "0",
        },
      }
    );
  } catch (e) {
    console.error("[GET /api/auth/me]", e);
    return NextResponse.json(
      { ok: false, user: null },
      {
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  }
}
