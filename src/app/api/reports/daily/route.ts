import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, private",
  "pragma": "no-cache",
  "expires": "0",
};

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
    }

    const url = new URL(req.url);
    const month = url.searchParams.get("month"); 
    const kind = url.searchParams.get("kind"); 
    const categoryId = url.searchParams.get("category_id"); 
    const min = url.searchParams.get("min"); 
    const max = url.searchParams.get("max"); 

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month (YYYY-MM) is required" }, { status: 400, headers: noStoreHeaders });
    }

    // Tính khoảng ngày của tháng : tạo nextMonth và trừ 1 ngày
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    const nextMonthStr = `${nextY}-${String(nextM).padStart(2, "0")}-01`;

    // where & params
    const where: string[] = ["user_id = ?"];
    const params: any[] = [userId];

    where.push("date >= ?");
    params.push(startDate);

    where.push("date < ?");
    params.push(nextMonthStr); 

    if (kind && kind !== "all") {
      where.push("kind = ?");
      params.push(kind);
    }
    if (categoryId && categoryId !== "all") {
      where.push("category_id = ?");
      params.push(Number(categoryId));
    }
    if (min && !Number.isNaN(Number(min))) {
      where.push("amount >= ?");
      params.push(Number(min));
    }
    if (max && !Number.isNaN(Number(max))) {
      where.push("amount <= ?");
      params.push(Number(max));
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    // Tổng theo loại
    const totals = db.prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN kind='expense' THEN amount END),0) AS expenseTotal,
        COALESCE(SUM(CASE WHEN kind='income'  THEN amount END),0) AS incomeTotal
      FROM expenses
      ${whereSql}
    `
    ).get(...params) as { expenseTotal: number | null; incomeTotal: number | null };

    // Tổng theo ngày
    const perDay = db.prepare(
      `
      SELECT
        date AS date,
        COALESCE(SUM(CASE WHEN kind='expense' THEN amount END),0) AS expense,
        COALESCE(SUM(CASE WHEN kind='income'  THEN amount END),0) AS income,
        COUNT(*) AS count
      FROM expenses
      ${whereSql}
      GROUP BY date
      ORDER BY date ASC
    `
    ).all(...params) as { date: string; expense: number; income: number; count: number }[];

    const payload = {
      expenseTotal: Number(totals?.expenseTotal ?? 0),
      incomeTotal : Number(totals?.incomeTotal ?? 0),
      days: perDay.map((r) => ({
        date: r.date,
        expense: Number(r.expense ?? 0),
        income : Number(r.income ?? 0),
        count  : Number(r.count ?? 0),
      })),
    };

    return NextResponse.json(payload, { headers: noStoreHeaders });
  } catch (e: any) {
    console.error("[GET /api/reports/daily]", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500, headers: noStoreHeaders });
  }
}
