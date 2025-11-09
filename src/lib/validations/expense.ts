import { z } from "zod";
export const ExpenseCreateSchema = z.object({
  amount: z.number().nonnegative(),
  note: z.string().optional(),
  date: z.string(),               
  categoryId: z.number().nullable().optional(),
});
export const ExpenseListQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["date","amount","created_at"]).default("date"),
  order: z.enum(["asc","desc"]).default("desc"),
  categoryId: z.coerce.number().optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export const ExpenseUpdateSchema = ExpenseCreateSchema.partial();
