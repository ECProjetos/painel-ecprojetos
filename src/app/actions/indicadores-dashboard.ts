"use server"

import { createClient } from "@/utils/supabase/server"

export type IndicadorDashboardItem = {
  colaborador_id: string
  colaborador_nome: string
  equipe: string | null
  ano: number
  trimestre: number
  total_entregas: number
  ies: number
  ip: number
  iq: number
  iev: number
  idi: number
}

type GetIndicadoresDashboardParams = {
  ano?: number
  trimestre?: number
  equipe?: string
  colaboradorId?: string
}

export async function getIndicadoresDashboard(
  params: GetIndicadoresDashboardParams = {},
): Promise<IndicadorDashboardItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from("vw_indicadores_colaborador_trimestre")
    .select("*")
    .order("ano", { ascending: false })
    .order("trimestre", { ascending: false })
    .order("colaborador_nome", { ascending: true })

  if (params.ano) {
    query = query.eq("ano", params.ano)
  }

  if (params.trimestre) {
    query = query.eq("trimestre", params.trimestre)
  }

  if (params.equipe) {
    query = query.eq("equipe", params.equipe)
  }

  if (params.colaboradorId) {
    query = query.eq("colaborador_id", params.colaboradorId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar indicadores do dashboard:", error)
    throw new Error("Não foi possível buscar os indicadores.")
  }

  return (data ?? []).map((item) => ({
    colaborador_id: item.colaborador_id,
    colaborador_nome: item.colaborador_nome,
    equipe: item.equipe,
    ano: Number(item.ano),
    trimestre: Number(item.trimestre),
    total_entregas: Number(item.total_entregas),
    ies: Number(item.ies),
    ip: Number(item.ip),
    iq: Number(item.iq),
    iev: Number(item.iev),
    idi: Number(item.idi),
  }))
}

export async function getIndicadoresDashboardFiltros() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_indicadores_colaborador_trimestre")
    .select("ano, trimestre, equipe, colaborador_id, colaborador_nome")

  if (error) {
    console.error("Erro ao buscar filtros de indicadores:", error)
    throw new Error("Não foi possível buscar os filtros dos indicadores.")
  }

  const itens = data ?? []

  const anos = Array.from(new Set(itens.map((item) => Number(item.ano))))
    .filter((ano) => !Number.isNaN(ano))
    .sort((a, b) => b - a)

  const trimestres = Array.from(
    new Set(itens.map((item) => Number(item.trimestre))),
  )
    .filter((tri) => !Number.isNaN(tri))
    .sort((a, b) => a - b)

  const equipes = Array.from(
    new Set(
      itens
        .map((item) => item.equipe)
        .filter((value): value is string => Boolean(value && value.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"))

  const colaboradores = Array.from(
    new Map(
      itens
        .filter(
          (item) =>
            item.colaborador_id &&
            item.colaborador_nome &&
            String(item.colaborador_nome).trim(),
        )
        .map((item) => [
          item.colaborador_id,
          {
            id: item.colaborador_id,
            nome: item.colaborador_nome,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

  return {
    anos,
    trimestres,
    equipes,
    colaboradores,
  }
}