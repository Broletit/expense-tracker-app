
import { Expense } from "../types";

export function groupByCategory(expenses: Expense[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const e of expenses) {
    result[e.category] = (result[e.category] || 0) + e.amount;
  }

  return result;
}
