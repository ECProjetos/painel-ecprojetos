"use server"

import { roles } from "@/constants/roles"
import { supabaseAdmin } from "@/utils/supabase/admin"
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

function getPeriodoKey(
  item: Pick<IndicadorDashboardItem, "ano" | "trimestre">,
) {
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

export type ColaboradorIndicadoresPainel = {
  id: string
  nome: string
  equipe: string | null
}

export type IndicadoresCorrecaoEntrega = {
  id: string
  codigo_projeto: string | null
  entrega_avaliada: string
  data_entrega: string
  ies_aprovado_primeira: boolean
  ip_no_prazo: boolean
  clareza_estrutura: number
  profundidade_rigor: number
  alinhamento_demanda: number
  forma_profissionalismo: number
}

export type IndicadoresCorrecaoDetalhes = {
  colaborador_id: string
  colaborador_nome: string
  equipe: string | null
  ano: number
  trimestre: number
  nota_evolucao: number | null
  entregas: IndicadoresCorrecaoEntrega[]
}

export type SalvarCorrecaoIndicadoresPayload = {
  colaborador_id: string
  ano: number
  trimestre: number
  motivo: string
  nota_evolucao: number | null
  entregas: Array<{
    id: string
    ies_aprovado_primeira: boolean
    ip_no_prazo: boolean
    clareza_estrutura: number
    profundidade_rigor: number
    alinhamento_demanda: number
    forma_profissionalismo: number
  }>
}

type UsuarioIndicadores = {
  id: string
  nome: string
  role: string
}

function getQuarterRange(ano: number, trimestre: number) {
  const startMonth = (trimestre - 1) * 3 + 1
  const endMonth = startMonth + 3
  const endYear = endMonth > 12 ? ano + 1 : ano
  const normalizedEndMonth = endMonth > 12 ? endMonth - 12 : endMonth

  const inicio = `${ano}-${String(startMonth).padStart(2, "0")}-01`
  const fimExclusivo = `${endYear}-${String(normalizedEndMonth).padStart(2, "0")}-01`

  return { inicio, fimExclusivo }
}

function validarAnoTrimestre(ano: number, trimestre: number) {
  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) {
    throw new Error("Ano inválido.")
  }

  if (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 4) {
    throw new Error("Trimestre inválido.")
  }
}

function validarNotaEntrega(value: number, field: string) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${field} deve ter uma nota inteira entre 1 e 5.`)
  }
}

async function getUsuarioIndicadoresAtual(): Promise<UsuarioIndicadores> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("users")
    .select("id, nome, role")
    .eq("id", user.id)
    .single()

  if (usuarioError || !usuario) {
    throw new Error("Não foi possível validar a permissão do usuário.")
  }

  return {
    id: String(usuario.id),
    nome: String(usuario.nome ?? user.email ?? "Usuário"),
    role: String(usuario.role ?? ""),
  }
}

async function ensureDiretorIndicadores() {
  const usuario = await getUsuarioIndicadoresAtual()

  if (usuario.role !== roles.diretor) {
    throw new Error("Apenas diretores podem corrigir notas dos indicadores.")
  }

  return usuario
}

export async function getColaboradoresAtivosIndicadoresPainel(): Promise<
  ColaboradorIndicadoresPainel[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("id, nome, departamento_nome, status, role")
    .eq("status", "ativo")
    .eq("role", roles.colaborador)
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores do quadro geral:", error)
    throw new Error("Não foi possível buscar os colaboradores ativos.")
  }

  return (data ?? [])
    .filter((item) => item.id && item.nome)
    .map((item) => ({
      id: String(item.id),
      nome: String(item.nome),
      equipe: toStringOrNull(item.departamento_nome),
    }))
}

export async function getPermissaoEdicaoIndicadores() {
  try {
    const usuario = await getUsuarioIndicadoresAtual()

    return {
      podeEditar: usuario.role === roles.diretor,
      role: usuario.role,
    }
  } catch (error) {
    console.error("Erro ao verificar permissão dos indicadores:", error)

    return {
      podeEditar: false,
      role: null,
    }
  }
}

export async function getIndicadoresCorrecaoDetalhes(params: {
  colaboradorId: string
  ano: number
  trimestre: number
}): Promise<IndicadoresCorrecaoDetalhes> {
  await ensureDiretorIndicadores()
  validarAnoTrimestre(params.ano, params.trimestre)

  if (!params.colaboradorId) {
    throw new Error("Colaborador não informado.")
  }

  const { inicio, fimExclusivo } = getQuarterRange(params.ano, params.trimestre)

  const [colaboradorResult, entregasResult, evolucaoResult] = await Promise.all(
    [
      supabaseAdmin
        .from("vw_colaboradores")
        .select("id, nome, departamento_nome")
        .eq("id", params.colaboradorId)
        .single(),
      supabaseAdmin
        .from("indicadores_desempenho")
        .select(
          `
        id,
        codigo_projeto,
        entrega_avaliada,
        data_entrega,
        ies_aprovado_primeira,
        ip_no_prazo,
        clareza_estrutura,
        profundidade_rigor,
        alinhamento_demanda,
        forma_profissionalismo
      `,
        )
        .eq("colaborador_id", params.colaboradorId)
        .gte("data_entrega", inicio)
        .lt("data_entrega", fimExclusivo)
        .order("data_entrega", { ascending: true })
        .order("entrega_avaliada", { ascending: true }),
      supabaseAdmin
        .from("avaliacoes_evolucao")
        .select("nota")
        .eq("colaborador_id", params.colaboradorId)
        .eq("ano", params.ano)
        .eq("trimestre", params.trimestre)
        .maybeSingle(),
    ],
  )

  if (colaboradorResult.error || !colaboradorResult.data) {
    console.error(
      "Erro ao buscar colaborador para correção:",
      colaboradorResult.error,
    )
    throw new Error("Não foi possível localizar o colaborador.")
  }

  if (entregasResult.error) {
    console.error(
      "Erro ao buscar entregas para correção:",
      entregasResult.error,
    )
    throw new Error("Não foi possível buscar as avaliações do período.")
  }

  if (evolucaoResult.error) {
    console.error("Erro ao buscar IEV para correção:", evolucaoResult.error)
    throw new Error("Não foi possível buscar a nota de evolução do período.")
  }

  return {
    colaborador_id: String(colaboradorResult.data.id),
    colaborador_nome: String(colaboradorResult.data.nome),
    equipe: toStringOrNull(colaboradorResult.data.departamento_nome),
    ano: params.ano,
    trimestre: params.trimestre,
    nota_evolucao:
      evolucaoResult.data?.nota === null ||
      evolucaoResult.data?.nota === undefined
        ? null
        : parseNumber(evolucaoResult.data.nota),
    entregas: (entregasResult.data ?? []).map((item) => ({
      id: String(item.id),
      codigo_projeto: toStringOrNull(item.codigo_projeto),
      entrega_avaliada: String(item.entrega_avaliada ?? "Entrega sem nome"),
      data_entrega: String(item.data_entrega ?? ""),
      ies_aprovado_primeira: Boolean(item.ies_aprovado_primeira),
      ip_no_prazo: Boolean(item.ip_no_prazo),
      clareza_estrutura: parseNumber(item.clareza_estrutura),
      profundidade_rigor: parseNumber(item.profundidade_rigor),
      alinhamento_demanda: parseNumber(item.alinhamento_demanda),
      forma_profissionalismo: parseNumber(item.forma_profissionalismo),
    })),
  }
}

export async function salvarCorrecaoIndicadores(
  payload: SalvarCorrecaoIndicadoresPayload,
) {
  const usuario = await ensureDiretorIndicadores()
  validarAnoTrimestre(payload.ano, payload.trimestre)

  if (!payload.colaborador_id) {
    throw new Error("Colaborador não informado.")
  }

  const motivo = payload.motivo?.trim()

  if (!motivo || motivo.length < 5) {
    throw new Error("Informe o motivo da correção com pelo menos 5 caracteres.")
  }

  if (
    payload.nota_evolucao !== null &&
    (!Number.isInteger(payload.nota_evolucao) ||
      payload.nota_evolucao < 1 ||
      payload.nota_evolucao > 5)
  ) {
    throw new Error("A nota de evolução deve estar entre 1 e 5.")
  }

  const entregaIds = payload.entregas.map((item) => item.id)

  if (new Set(entregaIds).size !== entregaIds.length) {
    throw new Error("Existem entregas duplicadas na correção.")
  }

  for (const entrega of payload.entregas) {
    if (!entrega.id) {
      throw new Error("Uma das entregas não possui identificação válida.")
    }

    validarNotaEntrega(entrega.clareza_estrutura, "Clareza e estrutura")
    validarNotaEntrega(entrega.profundidade_rigor, "Profundidade e rigor")
    validarNotaEntrega(entrega.alinhamento_demanda, "Alinhamento à demanda")
    validarNotaEntrega(
      entrega.forma_profissionalismo,
      "Forma e profissionalismo",
    )
  }

  const { inicio, fimExclusivo } = getQuarterRange(
    payload.ano,
    payload.trimestre,
  )

  let entregasAnteriores: Record<string, unknown>[] = []

  if (entregaIds.length) {
    const { data, error } = await supabaseAdmin
      .from("indicadores_desempenho")
      .select(
        `
        id,
        colaborador_id,
        data_entrega,
        ies_aprovado_primeira,
        ip_no_prazo,
        clareza_estrutura,
        profundidade_rigor,
        alinhamento_demanda,
        forma_profissionalismo
      `,
      )
      .in("id", entregaIds)
      .eq("colaborador_id", payload.colaborador_id)
      .gte("data_entrega", inicio)
      .lt("data_entrega", fimExclusivo)

    if (error) {
      console.error("Erro ao validar entregas da correção:", error)
      throw new Error("Não foi possível validar as entregas informadas.")
    }

    entregasAnteriores = (data ?? []) as Record<string, unknown>[]

    if (entregasAnteriores.length !== entregaIds.length) {
      throw new Error(
        "Uma ou mais entregas não pertencem ao colaborador e período selecionados.",
      )
    }
  }

  const { data: evolucaoAnterior, error: evolucaoAnteriorError } =
    await supabaseAdmin
      .from("avaliacoes_evolucao")
      .select("nota")
      .eq("colaborador_id", payload.colaborador_id)
      .eq("ano", payload.ano)
      .eq("trimestre", payload.trimestre)
      .maybeSingle()

  if (evolucaoAnteriorError) {
    console.error("Erro ao validar IEV anterior:", evolucaoAnteriorError)
    throw new Error("Não foi possível validar a nota de evolução anterior.")
  }

  for (const entrega of payload.entregas) {
    const { error } = await supabaseAdmin
      .from("indicadores_desempenho")
      .update({
        ies_aprovado_primeira: entrega.ies_aprovado_primeira,
        ip_no_prazo: entrega.ip_no_prazo,
        clareza_estrutura: entrega.clareza_estrutura,
        profundidade_rigor: entrega.profundidade_rigor,
        alinhamento_demanda: entrega.alinhamento_demanda,
        forma_profissionalismo: entrega.forma_profissionalismo,
      })
      .eq("id", entrega.id)
      .eq("colaborador_id", payload.colaborador_id)

    if (error) {
      console.error("Erro ao atualizar entrega do indicador:", error)
      throw new Error("Não foi possível atualizar uma das avaliações.")
    }
  }

  if (payload.nota_evolucao !== null) {
    const { error } = await supabaseAdmin.from("avaliacoes_evolucao").upsert(
      {
        colaborador_id: payload.colaborador_id,
        ano: payload.ano,
        trimestre: payload.trimestre,
        nota: payload.nota_evolucao,
      },
      {
        onConflict: "colaborador_id,ano,trimestre",
      },
    )

    if (error) {
      console.error("Erro ao atualizar nota de evolução:", error)
      throw new Error("Não foi possível atualizar a nota de evolução.")
    }
  }

  const alteracoes = {
    antes: {
      entregas: entregasAnteriores,
      nota_evolucao: evolucaoAnterior?.nota ?? null,
    },
    depois: {
      entregas: payload.entregas,
      nota_evolucao: payload.nota_evolucao,
    },
  }

  const { error: logError } = await supabaseAdmin
    .from("indicadores_correcoes_log")
    .insert({
      colaborador_id: payload.colaborador_id,
      ano: payload.ano,
      trimestre: payload.trimestre,
      motivo,
      alteracoes,
      corrigido_por: usuario.id,
      corrigido_por_nome: usuario.nome,
    })

  if (logError) {
    console.warn(
      "Correção salva, mas o registro de auditoria não pôde ser gravado:",
      logError,
    )
  }

  return { success: true }
}
