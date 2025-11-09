import { z } from "zod";
export const CategoryCreateSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
});
export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
  sort_order: z.number().int().optional(),
});
export const ReorderSchema = z.object({
  orders: z.array(z.object({ id: z.number().int(), sort_order: z.number().int() }))
});
