"use server"

import { BancoHorasType, FuncionarioSchema } from "@/types/inicio/banco-horas"
import {
  HistoricoDetalhado,
  historicoDetalhadoSchema,
  horaProjetoSchema,
} from "@/types/inicio/hora-projeto"
import {
  relatorioColaboradorSchema,
  RelatorioRh,
  RelatorioRh2,
  relatorioRhSchema,
  relatorioRhSchema2,
} from "@/types/inicio/relatorio-colaborador"
import { createClient } from "@/utils/supabase/server"

export async function getHours(): Promise<BancoHorasType | null> {
  const supabase = await createClient()

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const mesReferencia = `${ano}-${mes}`

  const { data, error, status, statusText } = await supabase
    .from("vw_banco_horas_tela")
    .select("*")
    .eq("mes_referencia", mesReferencia)
    .eq("status", "ativo")
    .order("user_name", { ascending: true })

  if (error || !data) return null

  const parsed = FuncionarioSchema.safeParse(data[0])
  if (!parsed.success) {
    console.error("Erro de validação:", parsed.error.format())
    return null
  }

  return { data, count: null, status, statusText, error: null }
}

export async function getHoursById(user_id: string) {
  const supabase = await createClient()

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const mesReferencia = `${ano}-${mes}`

  const data = await supabase
    .from("vw_banco_horas_tela")
    .select("*")
    .eq("user_id", user_id)
    .eq("mes_referencia", mesReferencia)

  const parsedData = data.data
    ? relatorioColaboradorSchema.safeParse(data.data[0])
    : null

  return parsedData
}

export async function getHoursProAct(user_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_horas_por_projeto_ou_atividade")
    .select("*")
    .eq("user_id", user_id)

  if (error || !data) return { success: false, data: null }

  const grouped = {
    projetos: data.filter((d) => d.tipo_agrupamento === "projeto"),
    atividades: data.filter((d) => d.tipo_agrupamento === "atividade"),
  }

  const parsed = horaProjetoSchema.safeParse(grouped)
  return { success: true, data: parsed.data }
}

export async function getHistoricoDetalhado(user_id: string): Promise<{
  success: boolean
  data: HistoricoDetalhado[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_historico_detalhado")
    .select("*")
    .eq("user_id", user_id)

  if (error || !data) return { success: false, data: [] }

  const parsed = historicoDetalhadoSchema.safeParse(data)
  return parsed.success
    ? { success: true, data: parsed.data }
    : { success: false, data: [] }
}

export async function getHoursRh(): Promise<RelatorioRh | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_rh_horas_agrupadas")
    .select("*")
  if (error || !data) return null

  const parsed = relatorioRhSchema.safeParse(data)
  if (!parsed.success) {
    console.error("Erro de validação:", parsed.error.format())
    return null
  }

  return parsed.data
}

export async function getHoursRhByAttProj(): Promise<RelatorioRh2 | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_dashboard_ponto_geral")
    .select("*")
  if (error || !data) return null

  const parsed = relatorioRhSchema2.safeParse(data)
  if (!parsed.success) {
    console.error("Erro de validação:", parsed.error.format())
    return null
  }

  return parsed.data
}

export async function getHoursIntExtMonthly(
  user_id: string,
  startDate: string,
  endDate: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_hours_int_ext_monthly", {
    p_user_id: user_id,
    p_start: startDate,
    p_end: endDate,
  })

  if (error || !data) {
    console.error("Erro RPC get_hours_int_ext_monthly:", error)
    return { success: false, horas_internas: 0, horas_externas: 0 }
  }

  return {
    success: true,
    horas_internas: Number(data[0]?.horas_internas ?? 0),
    horas_externas: Number(data[0]?.horas_externas ?? 0),
  }
}
