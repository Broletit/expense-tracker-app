import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  const { id: USER_ID } = await requireUser();
  const url = new URL(req.url);

  const period = url.searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      { error: "Missing or invalid period (YYYY-MM)" },
      { status: 400 },
    );
  }

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "all") as
    | "all"
    | "over"
    | "under";
  const categoryId = Number(url.searchParams.get("categoryId") || 0);

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 10)),
  );

  const baseSQL = `
    SELECT
      b.id,
      b.period,
      b.category_id,
      b.limit_amount,
      b.note,
      c.name AS cat_name,
      c.icon AS cat_icon,
      COALESCE(SUM(CASE WHEN e.kind='income'  THEN e.amount END), 0)  AS income_actual,
      COALESCE(SUM(CASE WHEN e.kind='expense' THEN e.amount END), 0)  AS expense_actual
    FROM budgets b
    LEFT JOIN expenses e
      ON e.user_id = b.user_id
     AND substr(e.date,1,7) = b.period
     AND (b.category_id IS NULL OR e.category_id = b.category_id)
    LEFT JOIN categories c
      ON c.id = b.category_id
     AND c.user_id = b.user_id
    WHERE b.user_id = ? AND b.period = ?
  `;

  const whereExtra: string[] = [];
  const params: any[] = [USER_ID, period];

  if (categoryId) {
    whereExtra.push(`b.category_id = ?`);
    params.push(categoryId);
  }

  if (q) {
    whereExtra.push(
      `(LOWER(c.name) LIKE ? OR LOWER(IFNULL(b.note,'')) LIKE ?)`,
    );
    params.push(`%${q}%`, `%${q}%`);
  }

  const groupOrder = ` GROUP BY b.id ORDER BY c.name COLLATE NOCASE ASC`;

  let sqlFull = `
    ${baseSQL}
    ${whereExtra.length ? " AND " + whereExtra.join(" AND ") : ""}
    ${groupOrder}
  `;

  const items = db
    .prepare(sqlFull)
    .all(...params) as Array<{
    id: number;
    period: string;
    category_id: number | null;
    limit_amount: number;
    note: string | null;
    cat_name: string | null;
    cat_icon: string | null;
    income_actual: number;
    expense_actual: number;
  }>;

  const mapped = items
    .map((it) => {
      const used = Math.max(
        0,
        Number(it.expense_actual || 0) - Number(it.income_actual || 0),
      );
      const over = used > Number(it.limit_amount || 0);
      return {
        id: it.id,
        user_id: USER_ID,
        category_id: it.category_id ?? 0,
        period: it.period,
        limit_amount: Number(it.limit_amount || 0),
        note: it.note,
        income_actual: Number(it.income_actual || 0),
        expense_actual: Number(it.expense_actual || 0),
        over_budget: over ? 1 : 0,
        cat_name: it.cat_name ?? "",
        cat_icon: it.cat_icon ?? null,
        used,
        over,
      };
    })
    .filter((x) =>
      status === "all" ? true : status === "over" ? x.over : !x.over,
    );

  const total = mapped.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageClamped = Math.min(page, pages);
  const start = (pageClamped - 1) * limit;
  const pageItems = mapped.slice(start, start + limit);

  return NextResponse.json({
    items: pageItems,
    meta: { page: pageClamped, limit, total, pages },
  });
}
