"use server"

import { createClient } from "@/utils/supabase/server"
import { getDashboardDataFiltered } from "@/app/actions/inicio/get-dashboard-data"

export type MeuPainelHorasFilters = {
  year?: string
  quarter?: string
  month?: string
  week?: string
  projetoId?: string
}

export type MeuProjetoHorasOption = {
  id: number
  code: string
  name: string
  status: string
}

export type MeuResumoHoras = {
  user_id: string
  user_name: string
  mes_referencia: string | null
  horas_trabalhadas_mes: number
  horas_a_fazer_mes: number
  banco_horas_anterior: number
  banco_horas_atual: number
  horas_somadas_banco: number
  business_days_passed: number
  working_hours_per_day: number
}

function getCurrentMonthReference() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")

  return `${ano}-${mes}`
}

function formatDateUTC(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function createUTCDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day))
}

function parseDateUTC(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number)

  return createUTCDate(year, month, day)
}

function addDaysUTC(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function getNumberFromPossibleColumns(
  row: Record<string, unknown>,
  columns: string[],
  fallback = 0,
) {
  for (const column of columns) {
    const value = row[column]

    if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }

  return fallback
}

function getPeriodoRecorte(filters: MeuPainelHorasFilters = {}) {
  const hoje = new Date()
  const hojeString = formatDateUTC(
    createUTCDate(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate()),
  )

  const ano =
    filters.year && filters.year !== "all"
      ? Number(filters.year)
      : hoje.getFullYear()

  let inicio: string
  let fim: string

  if (filters.month && filters.month !== "all") {
    const mes = Number(filters.month)
    const ultimoDiaMes = getLastDayOfMonth(ano, mes)

    if (filters.week && filters.week !== "all") {
      const semana = Number(filters.week)
      const diaInicio = (semana - 1) * 7 + 1
      const diaFim = Math.min(semana * 7, ultimoDiaMes)

      inicio = formatDateUTC(createUTCDate(ano, mes, diaInicio))
      fim = formatDateUTC(createUTCDate(ano, mes, diaFim))
    } else {
      inicio = formatDateUTC(createUTCDate(ano, mes, 1))
      fim = formatDateUTC(createUTCDate(ano, mes, ultimoDiaMes))
    }
  } else if (filters.quarter && filters.quarter !== "all") {
    const trimestre = Number(filters.quarter)
    const mesInicio = (trimestre - 1) * 3 + 1
    const mesFim = mesInicio + 2
    const ultimoDiaMesFim = getLastDayOfMonth(ano, mesFim)

    inicio = formatDateUTC(createUTCDate(ano, mesInicio, 1))
    fim = formatDateUTC(createUTCDate(ano, mesFim, ultimoDiaMesFim))
  } else {
    inicio = formatDateUTC(createUTCDate(ano, 1, 1))
    fim = formatDateUTC(createUTCDate(ano, 12, 31))
  }

  if (inicio <= hojeString && fim > hojeString) {
    fim = hojeString
  }

  return {
    inicio,
    fim,
  }
}

async function getHolidayDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inicio: string,
  fim: string,
) {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("event_date")
    .gte("event_date", inicio)
    .lte("event_date", fim)

  if (error) {
    console.error("Erro ao buscar feriados em calendar_events:", error)
    return new Set<string>()
  }

  return new Set(
    (data ?? [])
      .map((item) => String(item.event_date))
      .filter((date) => Boolean(date)),
  )
}

function countBusinessDays(
  inicio: string,
  fim: string,
  holidayDates: Set<string>,
) {
  let total = 0
  let currentDate = parseDateUTC(inicio)
  const endDate = parseDateUTC(fim)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay()
    const dateString = formatDateUTC(currentDate)

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidayDates.has(dateString)

    if (!isWeekend && !isHoliday) {
      total += 1
    }

    currentDate = addDaysUTC(currentDate, 1)
  }

  return total
}

async function getLoggedUserId() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Usuário não autenticado.")
  }

  return user.id
}

async function getUserWorkingHoursPerDay(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("working_hours_per_day")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar jornada diária do usuário:", error)
    return 0
  }

  return Number(data?.working_hours_per_day ?? 0)
}

export async function getMeusProjetosHorasOptions(): Promise<{
  success: boolean
  message?: string
  data: MeuProjetoHorasOption[]
}> {
  try {
    const supabase = await createClient()
    const userId = await getLoggedUserId()

    const { data: pontoRows, error: pontoError } = await supabase
      .from("v_ponto")
      .select("projeto")
      .eq("user_id", userId)
      .not("projeto", "is", null)
      .limit(5000)

    if (pontoError) {
      console.error("Erro ao buscar projetos do colaborador:", pontoError)

      return {
        success: false,
        message: "Não foi possível buscar os projetos do colaborador.",
        data: [],
      }
    }

    const projetoIds = [
      ...new Set(
        (pontoRows ?? [])
          .map((item) => Number(item.projeto))
          .filter((id) => Number.isFinite(id)),
      ),
    ]

    if (projetoIds.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, code, name, status")
      .in("id", projetoIds)
      .order("code", { ascending: true })

    if (projectsError) {
      console.error("Erro ao buscar dados dos projetos:", projectsError)

      return {
        success: false,
        message: "Não foi possível buscar os dados dos projetos.",
        data: [],
      }
    }

    return {
      success: true,
      data: (projects ?? []) as MeuProjetoHorasOption[],
    }
  } catch (error) {
    console.error("Erro geral em getMeusProjetosHorasOptions:", error)

    return {
      success: false,
      message: "Não foi possível carregar os projetos do colaborador.",
      data: [],
    }
  }
}

export async function getMeuPainelHoras(filters: MeuPainelHorasFilters = {}) {
  try {
    const supabase = await createClient()
    const userId = await getLoggedUserId()

    const mesReferenciaBancoAtual = getCurrentMonthReference()
    const periodo = getPeriodoRecorte(filters)

    const { data: resumoRow, error: resumoError } = await supabase
      .from("vw_banco_horas_tela")
      .select("*")
      .eq("user_id", userId)
      .eq("mes_referencia", mesReferenciaBancoAtual)
      .maybeSingle()

    if (resumoError) {
      console.error("Erro ao buscar resumo de horas do colaborador:", resumoError)
    }

    const dashboardData = await getDashboardDataFiltered({
      year: filters.year ?? "all",
      quarter: filters.quarter ?? "all",
      month: filters.month ?? "all",
      week: filters.week ?? "all",
      projetoId: filters.projetoId ?? "all",
      colaboradorId: userId,
    })

    const projetos = dashboardData.projetos ?? []

    const totalHorasRecorte = projetos.reduce(
      (acc, item) => acc + Number(item.horas_feitas ?? 0),
      0,
    )

    const totalHorasInt = projetos
      .filter((item) =>
        String(item.projeto_codigo ?? "")
          .toUpperCase()
          .startsWith("INT-"),
      )
      .reduce((acc, item) => acc + Number(item.horas_feitas ?? 0), 0)

    const totalHorasExt = projetos
      .filter((item) =>
        String(item.projeto_codigo ?? "")
          .toUpperCase()
          .startsWith("EXT-"),
      )
      .reduce((acc, item) => acc + Number(item.horas_feitas ?? 0), 0)

    const row = resumoRow ? (resumoRow as Record<string, unknown>) : {}

    const jornadaDiariaUsuario = await getUserWorkingHoursPerDay(userId)

    const jornadaDiariaDaView = getNumberFromPossibleColumns(row, [
      "working_hours_per_day",
      "jornada_diaria",
      "horas_dia",
      "carga_horaria_diaria",
    ])

    const jornadaDiaria =
      jornadaDiariaUsuario > 0 ? jornadaDiariaUsuario : jornadaDiariaDaView

    const feriados = await getHolidayDates(supabase, periodo.inicio, periodo.fim)
    const diasUteisRecorte = countBusinessDays(
      periodo.inicio,
      periodo.fim,
      feriados,
    )

    const horasPrevistasRecorte = diasUteisRecorte * jornadaDiaria

    const bancoHorasAnterior = getNumberFromPossibleColumns(row, [
      "banco_horas_anterior",
      "previous_balance",
      "saldo_anterior",
    ])

    const bancoHorasAtual = getNumberFromPossibleColumns(row, [
      "banco_horas_atual",
      "current_balance",
      "saldo_atual",
    ])

    const horasSomadasBanco = getNumberFromPossibleColumns(row, [
      "horas_somadas_banco",
      "horas_mes_banco",
      "month_balance",
    ])

    const resumo: MeuResumoHoras = {
      user_id: String(row.user_id ?? userId),
      user_name: String(row.user_name ?? row.nome ?? "Colaborador"),
      mes_referencia: mesReferenciaBancoAtual,
      horas_trabalhadas_mes: totalHorasRecorte,
      horas_a_fazer_mes: horasPrevistasRecorte,
      banco_horas_anterior: bancoHorasAnterior,
      banco_horas_atual: bancoHorasAtual,
      horas_somadas_banco: horasSomadasBanco,
      business_days_passed: diasUteisRecorte,
      working_hours_per_day: jornadaDiaria,
    }

    return {
      success: true,
      data: {
        resumo,
        projetos,
        totalHorasRecorte,
        totalHorasInt,
        totalHorasExt,
        totalProjetos: projetos.length,
      },
    }
  } catch (error) {
    console.error("Erro geral em getMeuPainelHoras:", error)

    return {
      success: false,
      message: "Não foi possível carregar o painel individual de horas.",
      data: null,
    }
  }
}