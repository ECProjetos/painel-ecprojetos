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
    user.user_metadata?.name ??
    user.user_metadata?.nome ??
    user.email ??
    null

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