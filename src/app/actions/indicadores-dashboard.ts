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
  media_ies_trimestre: number
  media_ip_trimestre: number
  media_iq_trimestre: number
  media_iev_trimestre: number
  media_idi_trimestre: number
  limite_atencao_trimestre: number
  status_trimestre: "OK" | "Atenção" | "Crítico"
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
    .from("vw_indicadores_dashboard_media")
    .select("*")
    .order("ano", { ascending: false })
    .order("trimestre", { ascending: false })
    .order("idi", { ascending: false })

  if (params.ano) query = query.eq("ano", params.ano)
  if (params.trimestre) query = query.eq("trimestre", params.trimestre)
  if (params.equipe) query = query.eq("equipe", params.equipe)
  if (params.colaboradorId) query = query.eq("colaborador_id", params.colaboradorId)

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
    media_ies_trimestre: Number(item.media_ies_trimestre),
    media_ip_trimestre: Number(item.media_ip_trimestre),
    media_iq_trimestre: Number(item.media_iq_trimestre),
    media_iev_trimestre: Number(item.media_iev_trimestre),
    media_idi_trimestre: Number(item.media_idi_trimestre),
    limite_atencao_trimestre: Number(item.limite_atencao_trimestre),
    status_trimestre: item.status_trimestre,
  }))
}

export async function getIndicadoresDashboardFiltros() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_indicadores_dashboard_media")
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
        .filter((item) => item.colaborador_id && item.colaborador_nome)
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