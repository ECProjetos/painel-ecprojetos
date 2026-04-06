"use server"

import { createClient } from "@/utils/supabase/server"

type DashboardFilterParams = {
  year?: string
  quarter?: string
  month?: string
  week?: string
  projetoId?: string
  colaboradorId?: string
}

type VPontoRow = {
  user_id: string
  user_name: string
  entry_date: string
  projeto: number
  projeto_nome: string
  worked_time: string
}

type ProjectRow = {
  id: number
  code: string
  name: string
  estimated_hours: number | null
  status: string
}

export type DashboardProjetoFiltrado = {
  projeto_id: number
  projeto_codigo: string
  projeto_nome: string
  status: string
  horas_estimadas: number
  horas_feitas: number
  saldo_horas: number
  percentual_consumido: number
  data_inicio_projeto: string | null
  data_ultima_apontada: string | null
}

export type DashboardColaboradorProjetoFiltrado = {
  projeto_id: number
  projeto_codigo: string
  projeto_nome: string
  status: string
  horas_estimadas_projeto: number
  user_id: string
  user_name: string
  horas_feitas: number
  total_horas_projeto: number
  percentual_participacao_projeto: number
  data_inicio_atuacao: string | null
  data_ultima_atuacao: string | null
}

export type DashboardDataResponse = {
  projetos: DashboardProjetoFiltrado[]
  colaboradores: DashboardColaboradorProjetoFiltrado[]
}

function intervalToHours(value: string | null | undefined) {
  if (!value) return 0

  const normalized = String(value).trim()

  const dayMatch = normalized.match(/(\d+)\s+days?\s+(\d+):(\d+):(\d+)/i)
  if (dayMatch) {
    const days = Number(dayMatch[1] ?? 0)
    const hours = Number(dayMatch[2] ?? 0)
    const minutes = Number(dayMatch[3] ?? 0)
    const seconds = Number(dayMatch[4] ?? 0)

    return days * 24 + hours + minutes / 60 + seconds / 3600
  }

  const parts = normalized.split(":")
  if (parts.length < 2) return 0

  const hours = Number(parts[0] ?? 0)
  const minutes = Number(parts[1] ?? 0)
  const seconds = Number(parts[2] ?? 0)

  return hours + minutes / 60 + seconds / 3600
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function getWeekOfMonth(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const day = date.getDate()
  return Math.ceil(day / 7)
}

function getDateRangeFromFilters(params: DashboardFilterParams) {
  const selectedYear =
    params.year && params.year !== "all" ? Number(params.year) : null

  let startDate: Date | null = null
  let endDate: Date | null = null

  if (selectedYear !== null) {
    startDate = new Date(selectedYear, 0, 1)
    endDate = new Date(selectedYear, 11, 31)
  }

  if (params.quarter && params.quarter !== "all" && selectedYear !== null) {
    const quarter = Number(params.quarter)
    const quarterStartMonth = (quarter - 1) * 3
    const quarterEndMonth = quarterStartMonth + 2

    startDate = new Date(selectedYear, quarterStartMonth, 1)
    endDate = new Date(selectedYear, quarterEndMonth + 1, 0)
  }

  if (params.month && params.month !== "all" && selectedYear !== null) {
    const month = Number(params.month) - 1
    startDate = new Date(selectedYear, month, 1)
    endDate = new Date(selectedYear, month + 1, 0)
  }

  return {
    startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
    endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
    selectedWeek:
      params.week && params.week !== "all" ? Number(params.week) : null,
  }
}

async function fetchAllVPontoRows(
  params: DashboardFilterParams,
  startDate: string | null,
  endDate: string | null,
): Promise<VPontoRow[]> {
  const supabase = await createClient()
  const pageSize = 1000
  let from = 0
  let allRows: VPontoRow[] = []

  while (true) {
    let query = supabase
      .from("v_ponto")
      .select(
        "user_id, user_name, entry_date, projeto, projeto_nome, worked_time",
      )
      .not("projeto", "is", null)
      .range(from, from + pageSize - 1)

    if (startDate) {
      query = query.gte("entry_date", startDate)
    }

    if (endDate) {
      query = query.lte("entry_date", endDate)
    }

    if (params.projetoId && params.projetoId !== "all") {
      query = query.eq("projeto", Number(params.projetoId))
    }

    if (params.colaboradorId && params.colaboradorId !== "all") {
      query = query.eq("user_id", params.colaboradorId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar v_ponto filtrada:", error)
      throw new Error("Não foi possível buscar os dados filtrados do dashboard.")
    }

    const batch = (data ?? []) as VPontoRow[]
    allRows = allRows.concat(batch)

    if (batch.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allRows
}

export async function getDashboardDataFiltered(
  params: DashboardFilterParams,
): Promise<DashboardDataResponse> {
  const supabase = await createClient()

  const { startDate, endDate, selectedWeek } = getDateRangeFromFilters(params)

  let rows = await fetchAllVPontoRows(params, startDate, endDate)

  if (selectedWeek) {
    rows = rows.filter((row) => getWeekOfMonth(row.entry_date) === selectedWeek)
  }

  const projetoIds = [
    ...new Set(rows.map((row) => row.projeto).filter(Boolean)),
  ]

  let projectsQuery = supabase
    .from("projects")
    .select("id, code, name, estimated_hours, status")

  if (projetoIds.length > 0) {
    projectsQuery = projectsQuery.in("id", projetoIds)
  }

  const { data: projectsData, error: projectsError } = await projectsQuery

  if (projectsError) {
    console.error("Erro ao buscar projetos:", projectsError)
    throw new Error("Não foi possível buscar os projetos do dashboard.")
  }

  const projects = (projectsData ?? []) as ProjectRow[]
  const projectMap = new Map(projects.map((project) => [project.id, project]))

  const projetoAgg = new Map<number, DashboardProjetoFiltrado>()
  const colaboradorAgg = new Map<string, DashboardColaboradorProjetoFiltrado>()

  for (const row of rows) {
    const project = projectMap.get(row.projeto)

    if (!project) continue

    const horas = intervalToHours(row.worked_time)

    const projetoAtual = projetoAgg.get(row.projeto)

    if (!projetoAtual) {
      projetoAgg.set(row.projeto, {
        projeto_id: row.projeto,
        projeto_codigo: project.code,
        projeto_nome: project.name,
        status: project.status,
        horas_estimadas: Number(project.estimated_hours ?? 0),
        horas_feitas: horas,
        saldo_horas: 0,
        percentual_consumido: 0,
        data_inicio_projeto: row.entry_date,
        data_ultima_apontada: row.entry_date,
      })
    } else {
      projetoAtual.horas_feitas += horas

      if (
        !projetoAtual.data_inicio_projeto ||
        row.entry_date < projetoAtual.data_inicio_projeto
      ) {
        projetoAtual.data_inicio_projeto = row.entry_date
      }

      if (
        !projetoAtual.data_ultima_apontada ||
        row.entry_date > projetoAtual.data_ultima_apontada
      ) {
        projetoAtual.data_ultima_apontada = row.entry_date
      }
    }

    const colaboradorKey = `${row.projeto}-${row.user_id}`
    const colaboradorAtual = colaboradorAgg.get(colaboradorKey)

    if (!colaboradorAtual) {
      colaboradorAgg.set(colaboradorKey, {
        projeto_id: row.projeto,
        projeto_codigo: project.code,
        projeto_nome: project.name,
        status: project.status,
        horas_estimadas_projeto: Number(project.estimated_hours ?? 0),
        user_id: row.user_id,
        user_name: row.user_name,
        horas_feitas: horas,
        total_horas_projeto: 0,
        percentual_participacao_projeto: 0,
        data_inicio_atuacao: row.entry_date,
        data_ultima_atuacao: row.entry_date,
      })
    } else {
      colaboradorAtual.horas_feitas += horas

      if (
        !colaboradorAtual.data_inicio_atuacao ||
        row.entry_date < colaboradorAtual.data_inicio_atuacao
      ) {
        colaboradorAtual.data_inicio_atuacao = row.entry_date
      }

      if (
        !colaboradorAtual.data_ultima_atuacao ||
        row.entry_date > colaboradorAtual.data_ultima_atuacao
      ) {
        colaboradorAtual.data_ultima_atuacao = row.entry_date
      }
    }
  }

  const projetos = [...projetoAgg.values()].map((item) => {
    const horasFeitas = round2(item.horas_feitas)
    const horasEstimadas = round2(item.horas_estimadas)
    const saldo = round2(horasEstimadas - horasFeitas)
    const percentual =
      horasEstimadas > 0 ? round2((horasFeitas / horasEstimadas) * 100) : 0

    return {
      ...item,
      horas_feitas: horasFeitas,
      horas_estimadas: horasEstimadas,
      saldo_horas: saldo,
      percentual_consumido: percentual,
    }
  })

  const totalHorasPorProjeto = new Map<number, number>()
  for (const projeto of projetos) {
    totalHorasPorProjeto.set(projeto.projeto_id, projeto.horas_feitas)
  }

  const colaboradores = [...colaboradorAgg.values()]
    .map((item) => {
      const totalProjeto = totalHorasPorProjeto.get(item.projeto_id) ?? 0
      const horasFeitas = round2(item.horas_feitas)
      const percentualParticipacao =
        totalProjeto > 0 ? round2((horasFeitas / totalProjeto) * 100) : 0

      return {
        ...item,
        horas_feitas: horasFeitas,
        total_horas_projeto: round2(totalProjeto),
        percentual_participacao_projeto: percentualParticipacao,
      }
    })
    .sort((a, b) => b.horas_feitas - a.horas_feitas)

  projetos.sort((a, b) => b.horas_feitas - a.horas_feitas)

  return {
    projetos,
    colaboradores,
  }
}