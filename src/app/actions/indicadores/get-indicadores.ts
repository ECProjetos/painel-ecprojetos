"use server"

import { createClient } from "@/utils/supabase/server"

export async function getIndicadoresDashboard() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_indicadores_colaborador_trimestre")
    .select("*")
    .order("idi", { ascending: false })

  if (error) {
    console.error("Erro ao buscar indicadores:", error)
    throw new Error("Erro ao buscar indicadores")
  }

  return data ?? []
}