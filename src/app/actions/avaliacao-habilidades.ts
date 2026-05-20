"use server";

import { createClient } from "@/utils/supabase/server";

export async function getHabilidadesPorDepartamento(departamentoNome: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("avaliacao_habilidades")
    .select("*")
    .eq("departamento_nome", departamentoNome)
    .eq("ativo", true)
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function salvarAvaliacaoHabilidades(payload: {
  colaborador_id: string;
  avaliador_id: string;
  periodo: string;
  respostas: {
    habilidade_id: string;
    nota: number;
    comentario?: string | null;
  }[];
}) {
  const supabase = await createClient();

  const registros = payload.respostas.map((resposta) => ({
    habilidade_id: resposta.habilidade_id,
    colaborador_id: payload.colaborador_id,
    avaliador_id: payload.avaliador_id,
    periodo: payload.periodo,
    nota: resposta.nota,
    comentario: resposta.comentario ?? null,
  }));

  const { error } = await supabase
    .from("avaliacao_habilidades_respostas")
    .insert(registros);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}