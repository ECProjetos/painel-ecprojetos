import { z } from "zod"

export const FuncionarioSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  mes_referencia: z.string(),
  mes_inicio: z.string().or(z.date()).transform((v) => String(v)),
  horas_trabalhadas: z.number(),
  horas_a_fazer: z.number(),
  horas_somadas_banco: z.number(),
  banco_horas_anterior: z.number(),
  banco_horas_atual: z.number(),
  departamento_id: z.number().nullable().optional(),
  departamento_nome: z.string().nullable().optional(),
  working_hours_per_day: z.number(),
  role: z.string(),
  status: z.string(),
})

export const UltimaImportacaoSchema = z.object({
  id: z.string(),
  status: z.string(),
  registros_importados: z.number().nullable(),
  mensagem: z.string().nullable(),
  iniciado_em: z.string().nullable(),
  finalizado_em: z.string().nullable(),
})

export const BancoHorasResponseSchema = z.object({
  error: z.string().nullable(),
  data: z.array(FuncionarioSchema),
  count: z.number().nullable(),
  status: z.number(),
  statusText: z.string(),
  ultima_importacao: UltimaImportacaoSchema.nullable().optional(),
})

export type BancoHorasType = z.infer<typeof BancoHorasResponseSchema>