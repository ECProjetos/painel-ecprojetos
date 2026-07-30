"use server"

import { randomUUID } from "crypto"

import { createClient } from "@/utils/supabase/server"
import {
  getAliasesEquipeOperacional,
  normalizarEquipeOperacional,
} from "@/lib/equipes"
import { usaNovaEscalaIesPorData } from "@/lib/indicadores-ies"

type CreateIndicadorPayload = {
  colaborador_id?: string
  colaborador_ids?: string[]
  equipe_colaborador?: string
  codigo_projeto: string
  entrega_avaliada: string
  data_entrega: string
  data_revisao: string
  ies_nota?: number | null
  ies_aprovado_primeira?: boolean
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
        .map((item) => normalizarEquipeOperacional(item.departamento_nome))
        .filter((value): value is string => {
          const nome = String(value ?? "").trim()

          if (!nome) return false

          return nome.toLowerCase() !== "todos"
        }),
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
    .in("role", ["COLABORADOR", "LIDER"])
    .neq("cargo_nome", "Diretor")
    .order("nome", { ascending: true })

  if (setorNome && setorNome !== "todos" && setorNome !== "all") {
    const aliases = getAliasesEquipeOperacional(setorNome)
    query = aliases.length > 1
      ? query.in("departamento_nome", aliases)
      : query.eq("departamento_nome", aliases[0] ?? setorNome)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error("Não foi possível buscar os colaboradores.")
  }

  return (data ?? []).map((item) => ({
    ...item,
    departamento_nome: normalizarEquipeOperacional(item.departamento_nome),
  }))
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

  const colaboradorIds = Array.from(
    new Set(
      [
        ...(payload.colaborador_ids ?? []),
        ...(payload.colaborador_id ? [payload.colaborador_id] : []),
      ].filter((value): value is string => Boolean(value && value.trim())),
    ),
  )

  if (!colaboradorIds.length) {
    throw new Error("Selecione pelo menos um colaborador.")
  }

  const avaliadorNome =
    user.user_metadata?.name ?? user.user_metadata?.nome ?? user.email ?? null

  const { data: colaboradores, error: colaboradoresError } = await supabase
    .from("vw_colaboradores")
    .select("id, departamento_nome")
    .in("id", colaboradorIds)

  if (colaboradoresError) {
    console.error(
      "Erro ao buscar setor dos colaboradores avaliados:",
      colaboradoresError,
    )
    throw new Error("Não foi possível identificar o setor dos colaboradores.")
  }

  const colaboradoresEncontrados = colaboradores ?? []
  const idsEncontrados = new Set(
    colaboradoresEncontrados.map((colaborador) => colaborador.id),
  )
  const idsNaoEncontrados = colaboradorIds.filter((id) => !idsEncontrados.has(id))

  if (idsNaoEncontrados.length) {
    throw new Error("Não foi possível identificar todos os colaboradores selecionados.")
  }

  const dataEntrega = payload.data_entrega?.trim()
  const dataRevisao = payload.data_revisao?.trim()

  if (!dataEntrega) {
    throw new Error("A data de entrega é obrigatória.")
  }

  if (!dataRevisao) {
    throw new Error("A data de revisão é obrigatória.")
  }

  const usaNovaEscalaIes = usaNovaEscalaIesPorData(dataEntrega)
  const iesNota =
    payload.ies_nota === null || payload.ies_nota === undefined
      ? null
      : Number(payload.ies_nota)

  if (
    usaNovaEscalaIes &&
    (!Number.isInteger(iesNota) || Number(iesNota) < 1 || Number(iesNota) > 5)
  ) {
    throw new Error("A nota do IES deve ser um número inteiro entre 1 e 5.")
  }

  if (!usaNovaEscalaIes && typeof payload.ies_aprovado_primeira !== "boolean") {
    throw new Error("Informe se a entrega foi aprovada na primeira submissão.")
  }

  const iesAprovadoPrimeira = usaNovaEscalaIes
    ? Number(iesNota) === 5
    : Boolean(payload.ies_aprovado_primeira)

  const avaliacaoGrupoId = randomUUID()

  const registros = colaboradorIds.map((colaboradorId) => {
    const colaborador = colaboradoresEncontrados.find(
      (item) => item.id === colaboradorId,
    )

    return {
      avaliacao_grupo_id: avaliacaoGrupoId,
      avaliador_id: user.id,
      avaliador_nome: avaliadorNome,
      colaborador_id: colaboradorId,
      equipe_colaborador: normalizarEquipeOperacional(
        colaborador?.departamento_nome ?? payload.equipe_colaborador ?? null,
      ),
      codigo_projeto: payload.codigo_projeto,
      entrega_avaliada: payload.entrega_avaliada,
      data_entrega: dataEntrega,
      data_revisao: dataRevisao,
      ies_nota: usaNovaEscalaIes ? iesNota : null,
      ies_aprovado_primeira: iesAprovadoPrimeira,
      ip_no_prazo: payload.ip_no_prazo,
      clareza_estrutura: payload.clareza_estrutura,
      profundidade_rigor: payload.profundidade_rigor,
      alinhamento_demanda: payload.alinhamento_demanda,
      forma_profissionalismo: payload.forma_profissionalismo,
      pontos_fortes: payload.pontos_fortes?.trim() || null,
      pontos_fracos: payload.pontos_fracos?.trim() || null,
      comentario_geral: payload.comentario_geral?.trim() || null,
    }
  })

  const { error } = await supabase
    .from("indicadores_desempenho")
    .insert(registros)

  if (error) {
    console.error("Erro ao salvar indicador:", error)
    throw new Error(error.message)
  }

  return { success: true, total: registros.length }
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
      avaliacao_grupo_id,
      colaborador_id,
      colaborador_nome,
      equipe_colaborador,
      codigo_projeto,
      entrega_avaliada,
      data_entrega,
      data_revisao,
      ies_nota,
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
    .from("vw_indicadores_dashboard_v3")
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
      avaliacao_grupo_id,
      created_at,
      avaliador_nome,
      colaborador_id,
      equipe_colaborador,
      codigo_projeto,
      entrega_avaliada,
      data_entrega,
      data_revisao,
      ies_nota,
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

  function getTextosUnicos(values: Array<string | null | undefined>) {
    const textos = values
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)

    return Array.from(new Set(textos))
  }

  function getTrimestreFromDate(value?: string | null) {
    if (!value) return null

    const parsed = new Date(`${value}T00:00:00`)

    if (Number.isNaN(parsed.getTime())) return null

    return Math.ceil((parsed.getMonth() + 1) / 3)
  }

  const registrosAgrupados = new Map<string, typeof registros>()

  for (const item of registros) {
    const grupoId = String(item.avaliacao_grupo_id ?? item.id)

    if (!registrosAgrupados.has(grupoId)) {
      registrosAgrupados.set(grupoId, [])
    }

    registrosAgrupados.get(grupoId)?.push(item)
  }

  const grupos = Array.from(registrosAgrupados.values())
  const contadorPorProjeto = new Map<string, number>()

  return grupos.map((itensDoGrupo, index) => {
    const item = itensDoGrupo[0]

    const colaboradoresDoGrupo = itensDoGrupo.map((registro) => {
      const colaborador = colaboradores?.find(
        (itemColaborador) => itemColaborador.id === registro.colaborador_id,
      )

      return {
        id: registro.colaborador_id,
        nome: colaborador?.nome ?? "Colaborador não identificado",
        equipe:
          registro.equipe_colaborador ??
          colaborador?.departamento_nome ??
          "Não informado",
      }
    })

    const colaboradorIdsGrupo = getTextosUnicos(
      colaboradoresDoGrupo.map((colaborador) => colaborador.id),
    )
    const colaboradorNomes = getTextosUnicos(
      colaboradoresDoGrupo.map((colaborador) => colaborador.nome),
    )
    const equipeNomes = getTextosUnicos(
      colaboradoresDoGrupo.map((colaborador) => colaborador.equipe),
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
      id: item.avaliacao_grupo_id ?? item.id,
      avaliacao_grupo_id: item.avaliacao_grupo_id ?? null,
      created_at: item.created_at,
      numero_relatorio: numeroRelatorio,
      codigo_relatorio_base: codigoRelatorioBase,
      codigo_relatorio_arquivo: `${numeroRelatorio}. ${codigoRelatorioBase}`,
      codigo_revisao_titulo: `${codigoProjeto}-${sequenciaProjeto}/${anoReferencia}`,
      avaliador_nome: item.avaliador_nome,
      colaborador_id: item.colaborador_id,
      colaborador_ids: colaboradorIdsGrupo,
      colaborador_nome: colaboradorNomes.length
        ? colaboradorNomes.join("; ")
        : "Colaborador não identificado",
      equipe_colaborador: equipeNomes.length
        ? equipeNomes.join("; ")
        : "Não informado",
      codigo_projeto: codigoProjeto,
      projeto_codigo: codigoProjeto,
      projeto_nome: projeto ? `${projeto.code} - ${projeto.name}` : codigoProjeto,
      entrega_avaliada: item.entrega_avaliada,
      data_entrega: item.data_entrega,
      data_revisao: item.data_revisao,
      ano: Number(anoReferencia),
      trimestre:
        getTrimestreFromDate(item.data_entrega) ??
        getTrimestreFromDate(item.data_revisao),
      ies_nota:
        item.ies_nota === null || item.ies_nota === undefined
          ? null
          : Number(item.ies_nota),
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
