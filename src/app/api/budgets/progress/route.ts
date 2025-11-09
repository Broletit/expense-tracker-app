import { NextResponse } from "next/server";
import db from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";

type Row = {
  id: number;
  user_id: number;
  category_id: number | null;
  period: string;
  limit_amount: number;
  note: string | null;
  income_actual: number;
  expense_actual: number;
  cat_name: string | null;
  cat_icon: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  if (!period) {
    return NextResponse.json({ error: "Missing period" }, { status: 400 });
  }

  const { id: USER_ID } = await requireUser();

  const sql = `
    SELECT
      b.id,
      b.user_id,
      b.category_id,
      b.period,
      b.limit_amount,
      b.note,
      COALESCE(SUM(CASE WHEN e.kind='income'  THEN e.amount END), 0)  AS income_actual,
      COALESCE(SUM(CASE WHEN e.kind='expense' THEN e.amount END), 0)  AS expense_actual,
      c.name AS cat_name,
      c.icon AS cat_icon
    FROM budgets b
    LEFT JOIN expenses e
      ON e.user_id = b.user_id
     AND substr(e.date,1,7) = b.period
     AND (b.category_id IS NULL OR e.category_id = b.category_id)
    LEFT JOIN categories c
      ON c.id = b.category_id
     AND c.user_id = b.user_id
    WHERE b.user_id = ? AND b.period = ?
    GROUP BY b.id
    ORDER BY b.category_id
  `;

  const stmt = db.prepare<Row>(sql);
  const items = stmt.all([USER_ID, period] as any) as Row[];

  const summary = items.reduce(
    (a, r) => {
      a.limit_total += Number(r.limit_amount || 0);
      a.income_total += Number(r.income_actual || 0);
      a.expense_total += Number(r.expense_actual || 0);
      return a;
    },
    { limit_total: 0, income_total: 0, expense_total: 0 }
  );

  return NextResponse.json({
    items: items.map((x) => ({
      id: x.id,
      user_id: x.user_id,
      category_id: x.category_id,
      period: x.period,
      limit_amount: Number(x.limit_amount),
      note: x.note,
      income_actual: Number(x.income_actual),
      expense_actual: Number(x.expense_actual),
      cat_name: x.cat_name ?? "",
      cat_icon: x.cat_icon ?? null,
    })),
    summary,
  });
}
