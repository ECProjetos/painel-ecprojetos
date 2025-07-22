'use server'

import { createClient } from '@/utils/supabase/server'

export async function SendEnpsForm(
  ano: string,
  periodo: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData,
) {
  const supabase = await createClient()

  const dataToInsert = {
    ano: Number(ano),
    periodo: periodo,
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
  }

  const { error } = await supabase.from('enps').insert(dataToInsert)

  if (error) {
    console.error('Error inserting eNPS data:', error)
    return { message: 'Erro ao enviar o formulário. Tente novamente.' }
  }

  return { message: 'Formulário enviado com sucesso!' }
}
