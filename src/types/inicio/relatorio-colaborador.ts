import { z } from "zod"

export const relatorioColaboradorSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  working_hours_per_day: z.number(),
  business_days_passed: z.number(),
  expected_hours: z.number(),
  actual_hours: z.number(),
  banco_horas_atual: z.number(),
})

export type relatorioColaborador = z.infer<typeof relatorioColaboradorSchema>
