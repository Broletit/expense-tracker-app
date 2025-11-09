import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to   = url.searchParams.get("to");

    const where: string[] = ["user_id = ?"];
    const params: any[]   = [userId];
    if (from) { where.push("date >= ?"); params.push(from); }
    if (to)   { where.push("date <= ?"); params.push(to); }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const totals = db.prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN kind='expense' THEN amount END),0) AS totalExpense,
        COALESCE(SUM(CASE WHEN kind='income'  THEN amount END),0) AS totalIncome,
        COALESCE(MAX(CASE WHEN kind='expense' THEN amount END),0) AS maxExpense
      FROM expenses
      ${whereSql}
    `
    ).get(...params) as { totalExpense:number|null; totalIncome:number|null; maxExpense:number|null };

    const safeTotals = {
      totalExpense: Number(totals?.totalExpense ?? 0),
      totalIncome : Number(totals?.totalIncome  ?? 0),
      maxExpense  : Number(totals?.maxExpense   ?? 0),
    };

    return NextResponse.json(
      { ...safeTotals, diff: safeTotals.totalIncome - safeTotals.totalExpense },
      { headers: noStoreHeaders }
    );
  } catch (e: any) {
    console.error("[GET /api/expenses/stats]", e);
    return NextResponse.json({ error: e.message ?? "Internal error" }, { status: 500, headers: noStoreHeaders });
  }
}

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, private",
  "pragma": "no-cache",
  "expires": "0",
};
