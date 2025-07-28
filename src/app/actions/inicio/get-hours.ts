"use server"
import { BancoHorasType, FuncionarioSchema } from "@/types/inicio/banco-horas";
import { HistoricoDetalhado, historicoDetalhadoSchema, horaProjetoSchema } from "@/types/inicio/hora-projeto"
import { relatorioColaboradorSchema } from "@/types/inicio/relatorio-colaborador"

import { createClient } from "@/utils/supabase/server"

export async function getHours(): Promise<BancoHorasType | null> {
  const supabase = await createClient();

  const { data, error, status, statusText } = await supabase
    .from("vw_user_month_balance")
    .select("*");

  if (error || !data) return null;

  const parsed = FuncionarioSchema.safeParse(data[0]);

  if (!parsed.success) {
    console.error("Erro de validação:", parsed.error.format());
    return null;
  }
  return {
    data,
    count: null,
    status,
    statusText,
    error: null
  };
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

export async function getHistoricoDetalhado(user_id: string): Promise<{
  success: boolean
  data: HistoricoDetalhado[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_historico_detalhado")
    .select("*")
    .eq("user_id", user_id)

  if (error || !data) {
    return { success: false, data: [] }
  }

  const parsed = historicoDetalhadoSchema.safeParse(data)

  if (parsed.success) {
    return { success: true, data: parsed.data }
  } else {
    return { success: false, data: [] }
  }
}