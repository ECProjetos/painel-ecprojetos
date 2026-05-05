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
  media_ies_trimestre?: number | null
  media_ip_trimestre?: number | null
  media_iq_trimestre?: number | null
  media_iev_trimestre?: number | null
  media_idi_trimestre?: number | null
  limite_atencao_trimestre?: number | null
  status_trimestre?: string | null
}

type GetIndicadoresDashboardParams = {
  ano?: number
  trimestre?: number
  equipe?: string
  colaboradorId?: string
}

type RawIndicadorDashboardItem = Record<string, unknown>

type MediaPeriodo = {
  quantidade: number
  ies: number
  ip: number
  iq: number
  iev: number
  idi: number
}

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const text = value.trim()
    const normalized = text.includes(",")
      ? text.replace(/\./g, "").replace(",", ".")
      : text
    const numberValue = Number(normalized)

    return Number.isFinite(numberValue) ? numberValue : 0
  }

  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numberValue = parseNumber(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function toStringOrNull(value: unknown) {
  if (typeof value !== "string") return null

  const text = value.trim()

  return text || null
}

function getPeriodoKey(item: Pick<IndicadorDashboardItem, "ano" | "trimestre">) {
  return `${item.ano}-T${item.trimestre}`
}

function mapIndicadorDashboardItem(
  item: RawIndicadorDashboardItem,
): IndicadorDashboardItem {
  return {
    colaborador_id: String(item.colaborador_id ?? ""),
    colaborador_nome: String(item.colaborador_nome ?? ""),
    equipe:
      toStringOrNull(item.equipe) ?? toStringOrNull(item.equipe_colaborador),
    ano: parseNumber(item.ano),
    trimestre: parseNumber(item.trimestre),
    total_entregas: parseNumber(
      item.total_entregas ?? item.entregas_no_periodo,
    ),
    ies: parseNumber(item.ies),
    ip: parseNumber(item.ip),
    iq: parseNumber(item.iq),
    iev: parseNumber(item.iev),
    idi: parseNumber(item.idi),
    media_ies_trimestre: parseNullableNumber(item.media_ies_trimestre),
    media_ip_trimestre: parseNullableNumber(item.media_ip_trimestre),
    media_iq_trimestre: parseNullableNumber(item.media_iq_trimestre),
    media_iev_trimestre: parseNullableNumber(item.media_iev_trimestre),
    media_idi_trimestre: parseNullableNumber(item.media_idi_trimestre),
    limite_atencao_trimestre: parseNullableNumber(
      item.limite_atencao_trimestre,
    ),
    status_trimestre: toStringOrNull(item.status_trimestre),
  }
}

function calcularMediasPorTrimestre(items: IndicadorDashboardItem[]) {
  const medias = new Map<string, MediaPeriodo>()

  for (const item of items) {
    const key = getPeriodoKey(item)
    const atual = medias.get(key) ?? {
      quantidade: 0,
      ies: 0,
      ip: 0,
      iq: 0,
      iev: 0,
      idi: 0,
    }

    atual.quantidade += 1
    atual.ies += item.ies
    atual.ip += item.ip
    atual.iq += item.iq
    atual.iev += item.iev
    atual.idi += item.idi

    medias.set(key, atual)
  }

  return medias
}

function enriquecerComMediasDoTrimestre(items: IndicadorDashboardItem[]) {
  const medias = calcularMediasPorTrimestre(items)

  return items.map((item) => {
    const media = medias.get(getPeriodoKey(item))

    if (!media?.quantidade) {
      return item
    }

    const mediaIES = media.ies / media.quantidade
    const mediaIP = media.ip / media.quantidade
    const mediaIQ = media.iq / media.quantidade
    const mediaIEV = media.iev / media.quantidade
    const mediaIDI = media.idi / media.quantidade

    return {
      ...item,
      media_ies_trimestre: mediaIES,
      media_ip_trimestre: mediaIP,
      media_iq_trimestre: mediaIQ,
      media_iev_trimestre: mediaIEV,
      media_idi_trimestre: mediaIDI,
      limite_atencao_trimestre: mediaIDI * 0.9,
    }
  })
}

async function fetchIndicadoresFromView(
  viewName: string,
  params: GetIndicadoresDashboardParams,
) {
  const supabase = await createClient()

  let query = supabase
    .from(viewName)
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

  return { data, error }
}

export async function getIndicadoresDashboard(
  params: GetIndicadoresDashboardParams = {},
): Promise<IndicadorDashboardItem[]> {
  const principal = await fetchIndicadoresFromView(
    "vw_indicadores_colaborador_trimestre",
    params,
  )

  if (!principal.error) {
    const items = (principal.data ?? []).map((item) =>
      mapIndicadorDashboardItem(item as RawIndicadorDashboardItem),
    )

    return enriquecerComMediasDoTrimestre(items)
  }

  console.warn(
    "vw_indicadores_colaborador_trimestre não pôde ser consultada. Usando vw_indicadores_dashboard como fallback.",
    principal.error,
  )

  const fallback = await fetchIndicadoresFromView(
    "vw_indicadores_dashboard",
    params,
  )

  if (fallback.error) {
    console.error("Erro ao buscar indicadores do dashboard:", fallback.error)
    throw new Error("Não foi possível buscar os indicadores.")
  }

  const items = (fallback.data ?? []).map((item) =>
    mapIndicadorDashboardItem(item as RawIndicadorDashboardItem),
  )

  return enriquecerComMediasDoTrimestre(items)
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

  const itens = (data ?? []) as RawIndicadorDashboardItem[]

  const anos: number[] = Array.from(
    new Set(itens.map((item) => parseNumber(item.ano))),
  )
    .filter((ano): ano is number => Number.isFinite(ano))
    .sort((a, b) => b - a)

  const trimestres: number[] = Array.from(
    new Set(itens.map((item) => parseNumber(item.trimestre))),
  )
    .filter((tri): tri is number => Number.isFinite(tri))
    .sort((a, b) => a - b)

  const equipes: string[] = Array.from(
    new Set(
      itens
        .map((item) => toStringOrNull(item.equipe))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"))

  const colaboradores: { id: string; nome: string }[] = Array.from(
    new Map(
      itens
        .filter(
          (item) =>
            item.colaborador_id &&
            item.colaborador_nome &&
            String(item.colaborador_nome).trim(),
        )
        .map((item) => [
          String(item.colaborador_id),
          {
            id: String(item.colaborador_id),
            nome: String(item.colaborador_nome),
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
