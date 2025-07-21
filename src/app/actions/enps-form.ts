'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function SendEnpsForm(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

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
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('enps_responses').insert(dataToInsert);

  if (error) {
    console.error('Erro ao inserir dados no Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
