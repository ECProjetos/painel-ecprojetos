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

  const { data, error, status, statusText } = await supabase
    .from("vw_user_month_balance")
    .select("*")

  if (error || !data) return null

  const parsed = FuncionarioSchema.safeParse(data[0])

  if (!parsed.success) {
    console.error("Erro de validação:", parsed.error.format())
    return null
  }
  return {
    data,
    count: null,
    status,
    statusText,
    error: null,
  }
}
export async function getHoursById(user_id: string) {
  const supabase = await createClient()

  const data = await supabase
    .from("vw_user_month_balance")
    .select("*")
    .eq("user_id", user_id)

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

  if (error || !data) {
    return { success: false, data: [] }
  }

  const parsed = historicoDetalhadoSchema.safeParse(data)

  if (parsed.success) {
    return { success: true, data: parsed.data }
  } else {
    return { success: false, data: [] }
  }
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

type HorasProjetoView = {
  agrupamento_id: number | null
  tipo_agrupamento: string
  total_horas: number | string | null
}

type ProjectCode = {
  id: number
  code: string | null
}

export async function getHoursIntExt(user_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_horas_por_projeto_ou_atividade")
    .select("agrupamento_id, tipo_agrupamento, total_horas")
    .eq("user_id", user_id)
    .eq("tipo_agrupamento", "projeto")

  if (error || !data) {
    console.error("Erro ao buscar horas por projeto:", error)
    return { success: false, horas_internas: 0, horas_externas: 0 }
  }

  const rows = data as HorasProjetoView[]

  const projectIds = Array.from(
    new Set(
      rows
        .map((r) => r.agrupamento_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  )

  if (projectIds.length === 0) {
    return { success: true, horas_internas: 0, horas_externas: 0 }
  }

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, code")
    .in("id", projectIds)

  if (pErr || !projects) {
    console.error("Erro ao buscar projects:", pErr)
    return { success: false, horas_internas: 0, horas_externas: 0 }
  }

  const projectList = projects as ProjectCode[]

  const codeById = new Map<number, string>()
  for (const p of projectList) {
    codeById.set(p.id, (p.code ?? "").toUpperCase())
  }

  let internas = 0
  let externas = 0

  for (const row of rows) {
    if (row.agrupamento_id == null) continue

    const code = codeById.get(row.agrupamento_id) ?? ""
    const h = Number(row.total_horas ?? 0)

    if (code.startsWith("INT")) internas += h
    else if (code.startsWith("EXT")) externas += h
  }

  return {
    success: true,
    horas_internas: internas,
    horas_externas: externas,
  }
}

type HistoricoRow = {
  entry_date: string
  projeto: string | null
  horas: number | string | null
}

type ProjectRow = {
  id: number
  name: string | null
  code: string | null
}

function normalizeName(v: string) {
  return v.trim().toUpperCase()
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