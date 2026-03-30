"use server"

import { createClient } from "@/utils/supabase/server"

export async function getProjetosDashboardOptions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("id, code, name, status")
    .eq("status", "ativo")
    .order("code", { ascending: true })

  if (error) {
    console.error("Erro ao buscar projetos para filtro:", error)
    throw new Error("Não foi possível buscar os projetos.")
  }

  return data ?? []
}

export async function getColaboradoresDashboardOptions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("id, nome, status")
    .eq("status", "ativo")
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores para filtro:", error)
    throw new Error("Não foi possível buscar os colaboradores.")
  }

  return data ?? []
}