"use server"

import { pontoSchema } from "@/types/inicio/ponto"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// 🔹 Busca todos os pontos (opcional)
export async function getPontos() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("ponto").select("*")

  if (error) {
    console.error("Erro ao buscar todos os pontos:", error)
    return []
  }

  return data
}

// 🔹 Deleta ponto por user_id, entry_date e entry_time
interface DeleteType {
  payload: {
    user_id: string
    entry_date: string
    entry_time: string
  }
}

export async function deletePonto({ payload }: DeleteType) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const userId = authData.user.id

  const hhmm = (payload.entry_time ?? "").trim().slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(hhmm)) {
    return { success: false, error: "Horário inválido para exclusão." }
  }

  const [hhStr, mmStr] = hhmm.split(":")
  const hh = Number(hhStr)
  const mm = Number(mmStr)

  // intervalo [HH:mm:00, HH:mm+1min:00)
  const start = `${hhStr}:${mmStr}:00`
  const nextTotal = hh * 60 + mm + 1
  const endH = String(Math.floor(nextTotal / 60) % 24).padStart(2, "0")
  const endM = String(nextTotal % 60).padStart(2, "0")
  const end = `${endH}:${endM}:00`

  // 1) Verifica o que vai apagar (bom para não “sumir” errado)
  const { data: rows, error: selError } = await supabase
    .from("ponto")
    .select("id, entry_time")
    .eq("user_id", userId)
    .eq("entry_date", payload.entry_date)
    .gte("entry_time", start)
    .lt("entry_time", end)

  if (selError) return { success: false, error: selError.message }
  if (!rows || rows.length === 0) {
    return {
      success: false,
      error:
        "Nada foi excluído no banco. Não existe registro neste minuto. Provável diferença maior que 1 minuto no horário salvo.",
    }
  }

  // 2) Deleta pelos IDs encontrados (mais seguro)
  const ids = rows.map((r: unknown) => (r as { id: string | number })?.id).filter(Boolean)

  if (ids.length === 0) {
    // fallback caso a tabela não tenha id
    const { error, count } = await supabase
      .from("ponto")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("entry_date", payload.entry_date)
      .gte("entry_time", start)
      .lt("entry_time", end)

    if (error) return { success: false, error: error.message }
    if (!count || count === 0) return { success: false, error: "A exclusão não afetou nenhuma linha." }
  } else {
    const { error, count } = await supabase
      .from("ponto")
      .delete({ count: "exact" })
      .in("id", ids)

    if (error) return { success: false, error: error.message }
    if (!count || count === 0) return { success: false, error: "A exclusão não afetou nenhuma linha." }
  }

  revalidatePath("/private/controle-horarios/inicio")
  return { success: true }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function savePonto(formData: FormData): Promise<any> {
  const data = Object.fromEntries(formData.entries())

  const result = pontoSchema.safeParse(data)
  if (!result.success) {
    return { success: false, error: "Dados do formulário inválidos." }
  }

  const values = result.data

  const supabase = await createClient()
  const { error } = await supabase.from("ponto").insert([values])

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    error: null,
    user_id: values.user_id,
    entry_date: values.entry_date,
    entry_time: values.entry_time,
  }
}
