"use server";

import { createClient } from "@/utils/supabase/server";
import { pontoSchema } from "@/types/inicio/ponto";

// Tipagem de retorno (opcional, mas recomendada)
type ActionResponse = { success: true; error: null } | { success: false; error: string };

export async function savePonto(formData: FormData): Promise<ActionResponse> {

  const data = Object.fromEntries(formData.entries());

  const result = pontoSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Dados do formulário inválidos." };
  }
  const values = result.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from("ponto")
    .insert([values]);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}
