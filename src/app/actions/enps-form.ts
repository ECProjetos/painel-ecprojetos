'use server';

import { createClient } from "@/utils/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function SendEnpsForm(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const dataToInsert = {
    department: formData.get('department'),
    enps_score: Number(formData.get('enpsScore')),
    enps_reason: formData.get('enpsReason'),
    centrado_cliente: Number(formData.get('centradoCliente')),
    qualidade_assegurada: Number(formData.get('qualidadeAssegurada')),
    avanco_tecnologico: Number(formData.get('avancoTecnologico')),
    eficiencia_dinamica: Number(formData.get('eficienciaDinamica')),
    colaboracao_integral: Number(formData.get('colaboracaoIntegral')),
    gestao_direta: Number(formData.get('gestaoDireta')),
    visao_futuro: Number(formData.get('visaoFuturo')),
  };

  const { error } = await supabase.from('enps_responses').insert(dataToInsert);

  if (error) {
    return { message: 'Erro ao enviar o formulário. Tente novamente.' };
  }

  return { message: 'Formulário enviado com sucesso!' };
}