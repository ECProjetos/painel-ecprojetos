'use server';

import { createClient } from "@/utils/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function SendNpsForm(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const dataToInsert = {
    nps_score: Number(formData.get('npsScore')),
    satisfacao_geral: Number(formData.get('satisfacaoGeral')),
    aplicacao_pratica: Number(formData.get('aplicacaoPratica')),
    adesao_cronograma: Number(formData.get('adesaoCronograma')),
    comunicacao_integral: Number(formData.get('comunicacaoIntegral')),
    comentario_geral: formData.get('comentarioGeral'),
    avanco_tecnologico: Number(formData.get('avancoTecnologico')),
    apresentacao_visual: Number(formData.get('apresentacaoVisual')),
  };

  const { error } = await supabase.from('satisfacao_cliente').insert(dataToInsert);

  if (error) {
    return { message: 'Erro ao enviar o formulário. Tente novamente.' };
  }

  return { message: 'Formulário enviado com sucesso!' };
}
