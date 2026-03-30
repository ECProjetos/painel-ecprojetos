"use server"

import { createClient } from "@/utils/supabase/server"
import {
  dashboardHorasColaboradorProjetoArraySchema,
  dashboardHorasProjetoArraySchema,
  type DashboardHorasColaboradorProjeto,
  type DashboardHorasProjeto,
} from "@/types/inicio/dashboard"

type GetDashboardHorasColaboradorProjetoParams = {
  projetoId?: number
}

export async function getDashboardHorasProjeto(): Promise<DashboardHorasProjeto[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_dashboard_horas_projeto")
    .select("*")
    .order("horas_feitas", { ascending: false })

  if (error) {
    console.error("Erro ao buscar dashboard de horas por projeto:", error)
    throw new Error("Não foi possível buscar as horas por projeto.")
  }

  const parsed = dashboardHorasProjetoArraySchema.safeParse(data ?? [])

  if (!parsed.success) {
    console.error(
      "Erro de validação em vw_dashboard_horas_projeto:",
      parsed.error.format(),
    )
    throw new Error("Os dados de horas por projeto vieram em formato inválido.")
  }

  return parsed.data
}

export async function getDashboardHorasColaboradorProjeto(
  params?: GetDashboardHorasColaboradorProjetoParams,
): Promise<DashboardHorasColaboradorProjeto[]> {
  const supabase = await createClient()

  let query = supabase
    .from("vw_dashboard_horas_colaborador_projeto")
    .select("*")
    .order("horas_feitas", { ascending: false })

  if (params?.projetoId) {
    query = query.eq("projeto_id", params.projetoId)
  }

  const { data, error } = await query

  if (error) {
    console.error(
      "Erro ao buscar dashboard de horas por colaborador no projeto:",
      error,
    )
    throw new Error(
      "Não foi possível buscar as horas por colaborador no projeto.",
    )
  }

  const parsed = dashboardHorasColaboradorProjetoArraySchema.safeParse(
    data ?? [],
  )

  if (!parsed.success) {
    console.error(
      "Erro de validação em vw_dashboard_horas_colaborador_projeto:",
      parsed.error.format(),
    )
    throw new Error(
      "Os dados de horas por colaborador no projeto vieram em formato inválido.",
    )
  }

  return parsed.data
}