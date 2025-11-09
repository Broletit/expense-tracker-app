import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

type CategoryRow = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  usage_count?: number | null;
};

export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const inuse = url.searchParams.get("inuse"); // '1' | '0' | null
    const sort = url.searchParams.get("sort") || "sort_order:asc";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 10)));
    const offset = (page - 1) * limit;

    const where: string[] = ["c.user_id = ?"];
    const params: Array<string | number> = [USER_ID];

    if (q) {
      where.push("LOWER(c.name) LIKE ?");
      params.push(`%${q}%`);
    }
    if (inuse === "1") {
      where.push(
        `EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = c.user_id AND e.category_id = c.id)`
      );
    } else if (inuse === "0") {
      where.push(
        `NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = c.user_id AND e.category_id = c.id)`
      );
    }

    let orderBy = "COALESCE(c.sort_order, 999999), c.name";
    if (sort === "name:asc") orderBy = "c.name COLLATE NOCASE ASC";
    else if (sort === "name:desc") orderBy = "c.name COLLATE NOCASE DESC";
    else if (sort === "usage:desc") orderBy = "usage_count DESC, c.name";
    else if (sort === "sort_order:asc") orderBy = "COALESCE(c.sort_order, 999999), c.name";

    const baseSql = `
      FROM categories c
      LEFT JOIN (
        SELECT e.category_id AS id, COUNT(*) AS usage_count
        FROM expenses e
        WHERE e.user_id = ?
        GROUP BY e.category_id
      ) u ON u.id = c.id
      WHERE ${where.join(" AND ")}
    `;
    params.unshift(USER_ID);

    const rows = db
      .prepare(
        `
        SELECT
          c.id, c.name, c.icon, c.color, c.sort_order,
          COALESCE(u.usage_count, 0) AS usage_count
        ${baseSql}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `
      )
      .all(...(params as any[]), limit, offset) as CategoryRow[];

    const totalRow = db
      .prepare(
        `
        SELECT COUNT(*) AS cnt
        ${baseSql}
      `
      )
      .get(...(params as any[])) as { cnt: number } | undefined;

    const total = totalRow?.cnt ?? 0;

    const items = (rows || []).map((r: CategoryRow) => ({
      id: r.id,
      name: r.name,
      icon: r.icon ?? undefined,
      color: r.color ?? undefined,
      usage_count: r.usage_count ?? 0,
    }));

    return NextResponse.json({
      ok: true,
      items,
      data: items,
      meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (e: any) {
    console.error("[GET /api/categories]", e);
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name, icon = "📁", color = "#3b82f6" } = body ?? {};

    if (!name || String(name).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "VALIDATION", message: "name required" },
        { status: 400 }
      );
    }

    const dup = db
      .prepare(`SELECT id FROM categories WHERE user_id = ? AND lower(name) = lower(?)`)
      .get(USER_ID, String(name).trim());
    if (dup) {
      return NextResponse.json(
        { ok: false, code: "DUPLICATE", message: "Danh mục đã tồn tại, vui lòng chọn tên khác" },
        { status: 409 }
      );
    }

    const info = db
      .prepare(
        `
        INSERT INTO categories (user_id, name, icon, color, sort_order)
        VALUES (?, ?, ?, ?, COALESCE((SELECT MAX(sort_order)+1 FROM categories WHERE user_id=?), 1))
      `
      )
      .run(USER_ID, String(name).trim(), icon, color, USER_ID);

    const id = Number(info.lastInsertRowid);
    return NextResponse.json({ ok: true, data: { id }, id }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/categories]", e);
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
