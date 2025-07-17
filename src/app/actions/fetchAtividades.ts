'use server';

import { AtividadeView } from "@/types/atidades";
import { createClient } from "@/utils/supabase/server";

export async function fetchAtividades(): Promise<AtividadeView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('activities')
        .select(`
      id,
      name,
      description,
      status,
      macroprocesso_id,
      processo_id,
      sub_processo_id,
      macroprocesso ( nome ),
      processo ( nome ),
      sub_processo ( nome )
    `);

    if (error) {
        console.error('Erro ao buscar atividades:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((a: any) => ({
        id: a.id,
        name: a.name,
        department_name: a.processo?.nome ?? '',
        description: a.description,
        status: a.status,
        macroprocesso_id: a.macroprocesso_id,
        processo_id: a.processo_id,
        sub_processo_id: a.sub_processo_id ?? null,
        macroprocesso_nome: a.macroprocesso?.nome ?? '',
        processo_nome: a.processo?.nome ?? '',
        sub_processo_nome: a.sub_processo?.nome ?? null,
    }));
}
