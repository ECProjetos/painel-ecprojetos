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

function getMesReferenciaAtual() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")

  return `${ano}-${mes}`
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

    const mesReferencia = getMesReferenciaAtual()

    const { data: resumoRow, error: resumoError } = await supabase
      .from("vw_banco_horas_tela")
      .select("*")
      .eq("user_id", userId)
      .eq("mes_referencia", mesReferencia)
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

    const projetos = dashboardData.projetos

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

    const resumo: MeuResumoHoras | null = resumoRow
      ? {
          user_id: String(resumoRow.user_id ?? userId),
          user_name: String(resumoRow.user_name ?? "Colaborador"),
          mes_referencia: resumoRow.mes_referencia
            ? String(resumoRow.mes_referencia)
            : null,
          horas_trabalhadas_mes: Number(
            resumoRow.horas_trabalhadas ?? resumoRow.actual_hours ?? 0,
          ),
          horas_a_fazer_mes: Number(
            resumoRow.horas_a_fazer ?? resumoRow.expected_hours ?? 0,
          ),
          banco_horas_anterior: Number(resumoRow.banco_horas_anterior ?? 0),
          banco_horas_atual: Number(resumoRow.banco_horas_atual ?? 0),
          horas_somadas_banco: Number(resumoRow.horas_somadas_banco ?? 0),
          business_days_passed: Number(resumoRow.business_days_passed ?? 0),
          working_hours_per_day: Number(resumoRow.working_hours_per_day ?? 0),
        }
      : null

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