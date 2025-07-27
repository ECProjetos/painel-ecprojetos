"use server"
import { horaProjetoSchema } from "@/types/inicio/hora-projeto"
import { relatorioColaboradorSchema } from "@/types/inicio/relatorio-colaborador"

import { createClient } from "@/utils/supabase/server"

export async function getHours() {
  const supabase = await createClient()

  const data = await supabase.from("vw_user_month_balance").select("*")
  const parsedData = relatorioColaboradorSchema.safeParse(data.data)

  return parsedData
}

export async function getHoursById(user_id: string) {
  const supabase = await createClient()

  const data = await supabase
    .from("vw_user_month_balance")
    .select("*")
    .eq("user_id", user_id)

  const parsedData = data.data
    ? relatorioColaboradorSchema.safeParse(data.data[0])
    : null
  console.log("Daata", data)
  console.log("parsedData", parsedData)

  return parsedData
}

export async function getHoursProAct(user_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_horas_por_projeto_ou_atividade")
    .select("*")
    .eq("user_id", user_id)

  if (error || !data) return { success: false, data: null }

  // transforma o array plano em objeto agrupado
  const grouped = {
    projetos: data.filter((d) => d.tipo_agrupamento === "projeto"),
    atividades: data.filter((d) => d.tipo_agrupamento === "atividade"),
  }

  const parsed = horaProjetoSchema.safeParse(grouped)

  return { success: true, data: parsed.data }
}
