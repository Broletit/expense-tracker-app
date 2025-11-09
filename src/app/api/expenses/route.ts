import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

// GET /api/expenses
export async function GET(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const url = new URL(req.url);

    const page  = Math.max(parseInt(url.searchParams.get("page")  || "1", 10), 1);
    const limit = Math.max(parseInt(url.searchParams.get("limit") || "10", 10), 1);
    const offset = (page - 1) * limit;

    const q          = url.searchParams.get("q")?.trim() || "";
    const from       = url.searchParams.get("from");
    const to         = url.searchParams.get("to");
    const kind       = url.searchParams.get("kind");         // expense|income
    const categoryId = url.searchParams.get("category_id");

    const sortRaw = url.searchParams.get("sort") || "date:desc";
    const [sortField, sortDirRaw] = sortRaw.split(":");
    const sortDir  = (sortDirRaw || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const sortCol  = ["date","amount","id"].includes(sortField || "") ? (sortField as string) : "date";

    const where: string[] = ["e.user_id = ?"];
    const params: any[]   = [USER_ID];

    if (q)   { where.push("e.description LIKE ?"); params.push(`%${q}%`); }
    if (from){ where.push("e.date >= ?");           params.push(from); }
    if (to)  { where.push("e.date <= ?");           params.push(to); }
    if (kind === "expense" || kind === "income") { where.push("e.kind = ?"); params.push(kind); }
    if (categoryId) { where.push("e.category_id = ?"); params.push(Number(categoryId)); }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const items = db.prepare(
      `
      SELECT
        e.id, e.date, e.kind, e.amount, e.description, e.category_id,
        c.name  AS category_name,
        c.icon  AS icon,
        c.color AS color
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
      `
    ).all(...params, limit, offset);

    const { total } = db.prepare(
      `SELECT COUNT(*) AS total FROM expenses e ${whereSql}`
    ).get(...params) as { total: number };

    return NextResponse.json({
      items,
      total,
      page,
      pageSize: limit,
      limit,
    });
  } catch (e: any) {
    console.error("[GET /api/expenses]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/expenses
export async function POST(req: Request) {
  try {
    const { id: USER_ID } = await requireUser();
    const body = await req.json();
    const { date, kind, amount, description, category_id } = body || {};

    if (!date || !kind || typeof amount !== "number")
      return NextResponse.json({ error: "date, kind, amount là bắt buộc" }, { status: 400 });

    if (!["expense","income"].includes(kind))
      return NextResponse.json({ error: "kind không hợp lệ" }, { status: 400 });

    const info = db.prepare(`
      INSERT INTO expenses (user_id, category_id, amount, description, date, kind)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(USER_ID, category_id ?? null, amount, description ?? null, date, kind);

    const created = db.prepare(`
      SELECT e.id, e.date, e.kind, e.amount, e.description, e.category_id,
             c.name AS category_name, c.icon AS icon, c.color AS color
      FROM expenses e
      LEFT JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
      WHERE e.id = ?
    `).get(Number(info.lastInsertRowid));

    return NextResponse.json({ ok: true, item: created, data: created });
  } catch (e: any) {
    console.error("[POST /api/expenses]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
