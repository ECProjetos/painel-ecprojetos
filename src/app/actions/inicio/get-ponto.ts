'use server';

import { pontoSchema, PontoType } from '@/types/inicio/ponto';
import { createClient } from '@/utils/supabase/server';


// 🔹 Busca todos os pontos (opcional)
export async function getPontos() {
  const supabase = await createClient();

  const { data, error } = await supabase.from('ponto').select('*');

  if (error) {
    console.error("Erro ao buscar todos os pontos:", error);
    return [];
  }

  return data;
}

// 🔹 Busca ponto por user_id + entry_date + entry_time (join com nome de projeto e atividade)
interface GetByIdDateType {
  payload: {
    user_id: string;
    entry_date: string;
  };
}


// 🔹 Deleta ponto por user_id, entry_date e entry_time
interface DeleteType {
  payload: {
    user_id: string;
    entry_date: string;
    entry_time: string;
  };
}

export async function deletePonto({ payload }: DeleteType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ponto')
    .delete()
    .eq('user_id', payload.user_id)
    .eq('entry_date', payload.entry_date)
    .eq('entry_time', payload.entry_time);

  if (error) {
    console.error('Erro ao deletar ponto:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function savePonto(formData: FormData): Promise<any> {
  const data = Object.fromEntries(formData.entries());

  const result = pontoSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Dados do formulário inválidos." };
  }

  const values = result.data;

  const supabase = await createClient();
  const { error } = await supabase.from("ponto").insert([values]);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    error: null,
    user_id: values.user_id,
    entry_date: values.entry_date,
    entry_time: values.entry_time,
  };
}