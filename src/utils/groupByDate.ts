import { Expense } from "../types";

export function groupByDate(expenses: Expense[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const e of expenses) {
    result[e.date] = (result[e.date] || 0) + e.amount;
  }

  return result;
}
