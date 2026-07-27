"use server"

import { createClient } from "@/utils/supabase/server"

type GetProdutosParams = {
  project_id: string | number
}

export async function getProdutosByProjectId({
  project_id,
}: GetProdutosParams) {
  const supabase = await createClient()

  const projectId = Number(project_id)

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return []
  }

  const { data, error } = await supabase
    .from("project_products")
    .select(`
      id,
      project_id,
      name,
      code,
      description,
      estimated_hours,
      status,
      sort_order
    `)
    .eq("project_id", projectId)
    .eq("status", "ativo")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar produtos do projeto:", error)

    throw new Error(
      "Não foi possível carregar os produtos vinculados ao projeto.",
    )
  }

  return data ?? []
}