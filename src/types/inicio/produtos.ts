import { z } from "zod"

export const productSchema = z.object({
  id: z.coerce.number().int().positive(),
  project_id: z.coerce.number().int().positive(),
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  estimated_hours: z.coerce.number().nonnegative().nullable().optional(),
  status: z.enum(["ativo", "inativo", "concluido"]),
  sort_order: z.coerce.number().int().nullable().optional(),
})

export const productsArraySchema = z.array(productSchema)

export type ProductType = z.infer<typeof productSchema>
export type ProductsType = z.infer<typeof productsArraySchema>