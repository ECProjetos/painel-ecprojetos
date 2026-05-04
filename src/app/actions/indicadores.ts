"use server"

import { createClient } from "@/utils/supabase/server"

type CreateIndicadorPayload = {
  colaborador_id: string
  equipe_colaborador?: string
  codigo_projeto: string
  entrega_avaliada: string
  data_entrega: string
  data_revisao: string
  ies_aprovado_primeira: boolean
  ip_no_prazo: boolean
  clareza_estrutura: number
  profundidade_rigor: number
  alinhamento_demanda: number
  forma_profissionalismo: number
  pontos_fortes?: string
  pontos_fracos?: string
  comentario_geral?: string
}

export async function getSetoresIndicadores() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("departamento_nome, status")
    .eq("status", "ativo")

  if (error) {
    console.error("Erro ao buscar setores:", error)
    throw new Error("Não foi possível buscar os setores.")
  }

  const setores = Array.from(
    new Set(
      (data ?? [])
        .map((item) => item.departamento_nome)
        .filter((value): value is string => Boolean(value && value.trim())),
    ),
  )
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((nome) => ({
      id: nome,
      nome,
    }))

  return setores
}

export async function getProjetosIndicadores() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("id, code, name, status")
    .order("code", { ascending: true })

  if (error) {
    console.error("Erro ao buscar projetos:", error)
    throw new Error("Não foi possível buscar os projetos.")
  }

  return data ?? []
}

export async function getColaboradoresIndicadoresBySetor(setorNome?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("vw_colaboradores")
    .select("id, nome, departamento_nome, status, role, cargo_nome")
    .eq("status", "ativo")
    .eq("role", "COLABORADOR")
    .neq("cargo_nome", "Diretor")
    .order("nome", { ascending: true })

  if (setorNome) {
    query = query.eq("departamento_nome", setorNome)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error("Não foi possível buscar os colaboradores.")
  }

  return data ?? []
}

export async function createIndicadorDesempenho(
  payload: CreateIndicadorPayload,
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário logado:", userError)
    throw new Error("Não foi possível identificar o avaliador logado.")
  }

  const avaliadorNome =
    user.user_metadata?.name ?? user.user_metadata?.nome ?? user.email ?? null

  const { data: colaborador, error: colaboradorError } = await supabase
    .from("vw_colaboradores")
    .select("id, departamento_nome")
    .eq("id", payload.colaborador_id)
    .single()

  if (colaboradorError || !colaborador) {
    console.error(
      "Erro ao buscar setor do colaborador avaliado:",
      colaboradorError,
    )
    throw new Error("Não foi possível identificar o setor do colaborador.")
  }

  const dataEntrega = payload.data_entrega?.trim()
  const dataRevisao = payload.data_revisao?.trim()

  if (!dataEntrega) {
    throw new Error("A data de entrega é obrigatória.")
  }

  if (!dataRevisao) {
    throw new Error("A data de revisão é obrigatória.")
  }

  const { error } = await supabase.from("indicadores_desempenho").insert({
    avaliador_id: user.id,
    avaliador_nome: avaliadorNome,
    colaborador_id: payload.colaborador_id,
    equipe_colaborador:
      colaborador.departamento_nome ?? payload.equipe_colaborador ?? null,
    codigo_projeto: payload.codigo_projeto,
    entrega_avaliada: payload.entrega_avaliada,
    data_entrega: dataEntrega,
    data_revisao: dataRevisao,
    ies_aprovado_primeira: payload.ies_aprovado_primeira,
    ip_no_prazo: payload.ip_no_prazo,
    clareza_estrutura: payload.clareza_estrutura,
    profundidade_rigor: payload.profundidade_rigor,
    alinhamento_demanda: payload.alinhamento_demanda,
    forma_profissionalismo: payload.forma_profissionalismo,
    pontos_fortes: payload.pontos_fortes?.trim() || null,
    pontos_fracos: payload.pontos_fracos?.trim() || null,
    comentario_geral: payload.comentario_geral?.trim() || null,
  })

  if (error) {
    console.error("Erro ao salvar indicador:", error)
    throw new Error(error.message)
  }

  return { success: true }
}

export async function getRelatorioIndicadores() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("relatorios_indicadores")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar relatório de indicadores:", error)
    throw new Error("Não foi possível buscar o relatório de indicadores.")
  }

  return data ?? []
}

export async function getRelatoriosPorEntrega() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("indicadores_desempenho")
    .select(
      `
      id,
      colaborador_id,
      colaborador_nome,
      equipe_colaborador,
      codigo_projeto,
      entrega_avaliada,
      data_entrega,
      data_revisao,
      ies_aprovado_primeira,
      ip_no_prazo,
      clareza_estrutura,
      profundidade_rigor,
      alinhamento_demanda,
      forma_profissionalismo,
      pontos_fortes,
      pontos_fracos,
      comentario_geral
    `,
    )
    .order("data_entrega", { ascending: false })

  if (error) {
    console.error(error)
    throw new Error("Erro ao buscar relatórios por entrega")
  }

  return data ?? []
}

export async function getIndicadoresDashboard() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_indicadores_dashboard")
    .select(
      `
      ano,
      trimestre,
      trimestre_label,
      colaborador_id,
      colaborador_nome,
      equipe,
      total_entregas,
      ies,
      ip,
      iq,
      iev,
      idi,
      media_ies_trimestre,
      media_ip_trimestre,
      media_iq_trimestre,
      media_iev_trimestre,
      media_idi_trimestre,
      limite_atencao_trimestre,
      status_trimestre
    `,
    )
    .order("ano", { ascending: false })
    .order("trimestre", { ascending: false })
    .order("idi", { ascending: false })

  if (error) {
    console.error("Erro ao buscar indicadores do dashboard:", error)
    throw new Error("Não foi possível buscar os indicadores do dashboard.")
  }

  return data ?? []
}

export async function getRelatoriosEntregasIndicadores() {
  const supabase = await createClient()

  const { data: avaliacoes, error } = await supabase
    .from("indicadores_desempenho")
    .select(`
      id,
      created_at,
      avaliador_nome,
      colaborador_id,
      equipe_colaborador,
      codigo_projeto,
      entrega_avaliada,
      data_entrega,
      data_revisao,
      ies_aprovado_primeira,
      ip_no_prazo,
      clareza_estrutura,
      profundidade_rigor,
      alinhamento_demanda,
      forma_profissionalismo,
      pontos_fortes,
      pontos_fracos,
      comentario_geral
    `)
    .order("data_revisao", { ascending: true })
    .order("data_entrega", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Erro ao buscar relatórios por entrega:", error)
    throw new Error("Não foi possível buscar os relatórios por entrega.")
  }

  const registros = avaliacoes ?? []

  const colaboradorIds = Array.from(
    new Set(
      registros
        .map((item) => item.colaborador_id)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  let colaboradores:
    | {
        id: string
        nome: string | null
        departamento_nome: string | null
      }[]
    | null = []

  if (colaboradorIds.length) {
    const { data, error: colaboradoresError } = await supabase
      .from("vw_colaboradores")
      .select("id, nome, departamento_nome")
      .in("id", colaboradorIds)

    if (colaboradoresError) {
      console.error(
        "Erro ao buscar colaboradores dos relatórios:",
        colaboradoresError,
      )
    }

    colaboradores = data ?? []
  }

  const { data: projetos, error: projetosError } = await supabase
    .from("projects")
    .select("id, code, name")

  if (projetosError) {
    console.error("Erro ao buscar projetos dos relatórios:", projetosError)
  }

  const contadorPorProjeto = new Map<string, number>()

  return registros.map((item, index) => {
    const colaborador = colaboradores?.find(
      (colaborador) => colaborador.id === item.colaborador_id,
    )

    const projeto = projetos?.find(
      (projeto) =>
        String(projeto.code) === String(item.codigo_projeto) ||
        String(projeto.id) === String(item.codigo_projeto),
    )

    const codigoProjetoBase = String(
      projeto?.code ?? item.codigo_projeto ?? "PROJ",
    )
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")

    const codigoProjeto = codigoProjetoBase || "PROJ"

    const anoReferencia =
      item.data_revisao?.slice(0, 4) ??
      item.data_entrega?.slice(0, 4) ??
      new Date().getFullYear().toString()

    const proximaSequencia = (contadorPorProjeto.get(codigoProjeto) ?? 0) + 1
    contadorPorProjeto.set(codigoProjeto, proximaSequencia)

    const sequenciaProjeto = String(proximaSequencia).padStart(3, "0")
    const numeroRelatorio = index + 1

    const codigoRelatorioBase = `EC-REV-${codigoProjeto}-${sequenciaProjeto}-${anoReferencia}`

    const iq =
      (Number(item.clareza_estrutura ?? 0) +
        Number(item.profundidade_rigor ?? 0) +
        Number(item.alinhamento_demanda ?? 0) +
        Number(item.forma_profissionalismo ?? 0)) /
      4

    return {
      id: item.id,
      created_at: item.created_at,
      numero_relatorio: numeroRelatorio,
      codigo_relatorio_base: codigoRelatorioBase,
      codigo_relatorio_arquivo: `${numeroRelatorio}. ${codigoRelatorioBase}`,
      codigo_revisao_titulo: `${codigoProjeto}-${sequenciaProjeto}/${anoReferencia}`,
      avaliador_nome: item.avaliador_nome,
      colaborador_id: item.colaborador_id,
      colaborador_nome: colaborador?.nome ?? "Colaborador não identificado",
      equipe_colaborador:
        item.equipe_colaborador ??
        colaborador?.departamento_nome ??
        "Não informado",
      codigo_projeto: codigoProjeto,
      projeto_nome: projeto
        ? `${projeto.code} - ${projeto.name}`
        : codigoProjeto,
      entrega_avaliada: item.entrega_avaliada,
      data_entrega: item.data_entrega,
      data_revisao: item.data_revisao,
      ies_aprovado_primeira: Boolean(item.ies_aprovado_primeira),
      ip_no_prazo: Boolean(item.ip_no_prazo),
      clareza_estrutura: Number(item.clareza_estrutura ?? 0),
      profundidade_rigor: Number(item.profundidade_rigor ?? 0),
      alinhamento_demanda: Number(item.alinhamento_demanda ?? 0),
      forma_profissionalismo: Number(item.forma_profissionalismo ?? 0),
      iq,
      pontos_fortes: item.pontos_fortes,
      pontos_fracos: item.pontos_fracos,
      comentario_geral: item.comentario_geral,
    }
  })
}