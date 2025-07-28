// hora-projeto.ts

import { z } from "zod"

export const agrupamentoItemSchema = z.object({
  agrupamento_id: z.number(),
  nome_agrupamento: z.string(),
  total_horas: z.number(),
  data_inicio: z.string(),
  data_fim: z.string()
})

export const horaProjetoSchema = z.object({
  projetos: z.array(agrupamentoItemSchema),
  atividades: z.array(agrupamentoItemSchema),
})

export type horaProjeto = z.infer<typeof horaProjetoSchema>
      

export const historicoItemSchema = z.object({
  user_id: z.string(),
  entry_date: z.string(),
  entry_time: z.string(),
  fim_time: z.string(),
  projeto: z.string(),
  atividade: z.string(),
  horas: z.number(),
})


export const historicoDetalhadoSchema = z.array(historicoItemSchema)

export type HistoricoDetalhado = z.infer<typeof historicoItemSchema>