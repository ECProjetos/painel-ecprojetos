// hora-projeto.ts

import { z } from "zod"

export const agrupamentoItemSchema = z.object({
  agrupamento_id: z.number(),
  nome_agrupamento: z.string(),
  total_horas: z.number(),
})

export const horaProjetoSchema = z.object({
  projetos: z.array(agrupamentoItemSchema),
  atividades: z.array(agrupamentoItemSchema),
})

export type horaProjeto = z.infer<typeof horaProjetoSchema>
