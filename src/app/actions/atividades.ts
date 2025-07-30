/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NewAtividade } from "@/types/atidades";

export async function createAtividade(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();

    const nome = formData.get("nome") as string;
    const processoIdRaw = formData.get("processo");
    const subProcessoIdRaw = formData.get("subprocesso");
    let processoId: number | null = processoIdRaw ? parseInt(processoIdRaw as string) : null;
    const subProcessoId = subProcessoIdRaw ? parseInt(subProcessoIdRaw as string) : null;
    const departamentos = formData.getAll("departamentos") as string[];
    const departamentoIds = departamentos.map((id) => parseInt(id));

    // Caso processoId seja nulo, mas tenha subProcessoId, buscar o processo via subProcesso
    if (!processoId && subProcessoId) {
      const { data: subProcessoData, error: subProcError } = await supabase
        .from('sub_processo')
        .select('processo_id')
        .eq('id', subProcessoId)
        .single();

      if (subProcError || !subProcessoData) {
        return { success: false, message: 'Erro ao buscar processo do subprocesso selecionado.' };
      }
      processoId = subProcessoData.processo_id;
    }

    if (!processoId) {
      return { success: false, message: 'Processo não selecionado.' };
    }

    // Buscar o macroprocesso
    const { data: processoData, error: procError } = await supabase
      .from('processo')
      .select('macroprocesso_id')
      .eq('id', processoId)
      .single();

    if (procError || !processoData) {
      return { success: false, message: 'Erro ao buscar macroprocesso do processo selecionado.' };
    }
    const macroprocessoId = processoData.macroprocesso_id;

    // Inserir atividade
    const { data: inserted, error: insertError } = await supabase
      .from("activities")
      .insert({
        name: nome,
        macroprocesso_id: macroprocessoId,
        processo_id: processoId,
        sub_processo_id: subProcessoId,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, message: "Atividade já existe com esses dados." }
      }
      return { success: false, message: "Erro ao criar atividade: " + insertError.message }
    }

    // Relaciona os departamentos à atividade criada
    const relations = departamentoIds.map((depId) => ({
      activity_id: inserted.id,
      department_id: depId,
    }));

    const { error: depError } = await supabase
      .from("activity_departments")
      .insert(relations);

    if (depError) {
      return { success: false, message: "Atividade criada, mas erro ao associar departamentos." }
    }

    revalidatePath("/controle-horarios/direcao/atividades");

    return { success: true, message: "Atividade criada com sucesso!" }

  } catch (err: any) {
    return { success: false, message: err.message || "Erro inesperado ao criar atividade." }
  }
}

export async function getAllAtividades() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("activities")
            .select("*")
            .order("name", { ascending: false });

        if (error) {
            console.error("Erro ao buscar atividades:", error);
            throw new Error("Erro ao buscar atividades: " + error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao obter atividades:", error);
        throw new Error("Erro desconhecido ao obter atividades. Entrar em contato com o suporte.");
    }
}

export async function getAtividadeById(id: number) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("activities")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Erro ao buscar atividade:", error);
            throw new Error("Erro ao buscar atividade: " + error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao obter atividade:", error);
        throw new Error("Erro desconhecido ao obter atividade. Entrar em contato com o suporte.");
    }
}

export async function updateAtividade(id: number, atividade: NewAtividade) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("activities")
            .update(atividade)
            .eq("id", id);

        if (error) {
            console.error("Erro ao atualizar atividade:", error);
            throw new Error("Erro ao atualizar atividade: " + error.message);
        }

        // Revalidar o caminho para atualizar a lista de atividades
        revalidatePath("/controle-horarios/direcao/atividades");

    } catch (error: any) {
        console.error("Erro ao atualizar atividade:", error);
        throw new Error(error.message || "Erro desconhecido ao atualizar atividade. Entrar em contato com o suporte.");
    }
}

export async function deleteAtividade(id: number) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("activities")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao deletar atividade:", error);
            throw new Error("Erro ao deletar atividade: " + error.message);
        }

        // Revalidar o caminho para atualizar a lista de atividades
        revalidatePath("/controle-horarios/direcao/atividades");

    } catch (error) {
        console.error("Erro ao deletar atividade:", error);
        throw new Error("Erro desconhecido ao deletar atividade. Entrar em contato com o suporte.");
    }
}
