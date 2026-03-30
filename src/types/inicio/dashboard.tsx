import { z } from "zod"

export const dashboardHorasProjetoSchema = z.object({
  projeto_id: z.number(),
  projeto_codigo: z.string(),
  projeto_nome: z.string(),
  status: z.string(),
  horas_estimadas: z.number(),
  horas_feitas: z.number(),
  saldo_horas: z.number(),
  percentual_consumido: z.number(),
  data_inicio_projeto: z.string().nullable(),
  data_ultima_apontada: z.string().nullable(),
})

export const dashboardHorasProjetoArraySchema = z.array(
  dashboardHorasProjetoSchema,
)

export type DashboardHorasProjeto = z.infer<typeof dashboardHorasProjetoSchema>

export const dashboardHorasColaboradorProjetoSchema = z.object({
  projeto_id: z.number(),
  projeto_codigo: z.string(),
  projeto_nome: z.string(),
  status: z.string(),
  horas_estimadas_projeto: z.number(),
  user_id: z.string(),
  user_name: z.string(),
  horas_feitas: z.number(),
  total_horas_projeto: z.number(),
  percentual_participacao_projeto: z.number(),
  data_inicio_atuacao: z.string().nullable(),
  data_ultima_atuacao: z.string().nullable(),
})

export const dashboardHorasColaboradorProjetoArraySchema = z.array(
  dashboardHorasColaboradorProjetoSchema,
)

export type DashboardHorasColaboradorProjeto = z.infer<
  typeof dashboardHorasColaboradorProjetoSchema
>