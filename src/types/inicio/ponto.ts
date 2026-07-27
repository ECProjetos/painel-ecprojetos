import { z } from "zod"

export const pontoSchema = z.object({
  user_id: z.string(),

  entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Data inválida",
  }),

  entry_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de entrada inválida (HH:mm)",
  }),

  exit_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de saída inválida (HH:mm)",
  }),

  projeto: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  atividade: z.string().nullable().optional(),
})

export type PontoType = z.infer<typeof pontoSchema>

const nestedSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const nestedPontoSchema = z.object({
  user_id: z.string(),

  entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Data inválida",
  }),

  entry_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de entrada inválida (HH:mm)",
  }),

  exit_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de saída inválida (HH:mm)",
  }),

  projeto: nestedSchema.nullable().optional(),
  produto: nestedSchema.nullable().optional(),
  atividade: nestedSchema.nullable().optional(),
})

export type nestedPontoType = z.infer<typeof nestedPontoSchema>