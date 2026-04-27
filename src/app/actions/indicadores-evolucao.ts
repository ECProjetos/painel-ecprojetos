"use server"

import { createClient } from "@/utils/supabase/server"

type CreateAvaliacaoEvolucaoPayload = {
  colaborador_id: string
  ano: number
  trimestre: number
  nota: number
}

export async function getColaboradoresEvolucao() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("id, nome, departamento_nome, status, role, cargo_nome")
    .eq("status", "ativo")
    .eq("role", "COLABORADOR")
    .neq("cargo_nome", "Diretor")
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores para evolução:", error)
    throw new Error("Não foi possível buscar os colaboradores.")
  }

  return data ?? []
}

export async function createAvaliacaoEvolucao(
  payload: CreateAvaliacaoEvolucaoPayload,
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário logado:", userError)
    throw new Error("Não foi possível identificar o usuário logado.")
  }

  if (!payload.colaborador_id) {
    throw new Error("O colaborador é obrigatório.")
  }

  if (
    !Number.isInteger(payload.ano) ||
    payload.ano < 2020 ||
    payload.ano > 2100
  ) {
    throw new Error("Ano inválido.")
  }

  if (
    !Number.isInteger(payload.trimestre) ||
    payload.trimestre < 1 ||
    payload.trimestre > 4
  ) {
    throw new Error("Trimestre inválido.")
  }

  if (!Number.isInteger(payload.nota) || payload.nota < 1 || payload.nota > 5) {
    throw new Error("A nota deve estar entre 1 e 5.")
  }

  const { error } = await supabase.from("avaliacoes_evolucao").upsert(
    {
      colaborador_id: payload.colaborador_id,
      ano: payload.ano,
      trimestre: payload.trimestre,
      nota: payload.nota,
    },
    {
      onConflict: "colaborador_id,ano,trimestre",
    },
  )

  if (error) {
    console.error("Erro ao salvar avaliação de evolução:", error)
    throw new Error(error.message)
  }

  return { success: true }
}
