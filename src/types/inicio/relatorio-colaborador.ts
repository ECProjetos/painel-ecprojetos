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

export const relatorioRhSchema1 = z.object({
 agrupamento_id :z.number(),
 tipo_agrupamento : z.string(),
 nome_agrupamento: z.string(),
 total_horas: z.number()
})

export const relatorioRhSchema = z.array(relatorioRhSchema1)

export type RelatorioRh = z.infer<typeof relatorioRhSchema>

export const relatorioRhSchema3 = z.object({
  tipo: z.string(),                       // "horas_funcionario_atividade", "horas_projeto_atividade", "relatorio_detalhado"
  projeto: z.string().nullable(),         // Pode ser null em alguns tipos
  atividade: z.string().nullable(),
  funcionario: z.string().nullable(),
  data: z.string().nullable(),            // Retorna em formato "YYYY-MM-DD" (string ISO do Supabase)
  periodo: z.string().nullable(),         // Ex: "08:00 - 10:00"
  horas: z.number(),                      // Horas arredondadas (ex: 2.0)
  percentual: z.number().nullable(), 
})

export const relatorioRhSchema2 = z.array(relatorioRhSchema3)

export type RelatorioRh2 = z.infer<typeof relatorioRhSchema2>