"use server"

import { createClient } from "@/utils/supabase/server"
import { pontoSchema } from "@/types/inicio/ponto"

type ActionResponse =
  | { success: true; error: null }
  | { success: false; error: string }

export async function savePonto(
  formData: FormData,
): Promise<ActionResponse> {
  const data = Object.fromEntries(formData.entries())

  const result = pontoSchema.safeParse(data)

  if (!result.success) {
    console.error(result.error.flatten())

    return {
      success: false,
      error: "Dados do formulário inválidos.",
    }
  }

  const values = {
    ...result.data,
    projeto: result.data.projeto ? Number(result.data.projeto) : null,
    product_id: result.data.product_id
      ? Number(result.data.product_id)
      : null,
    atividade: result.data.atividade
      ? Number(result.data.atividade)
      : null,
  }

  const supabase = await createClient()

  const { error } = await supabase.from("ponto").insert([values])

  if (error) {
    console.error("Erro ao salvar ponto:", error)

    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    error: null,
  }
}