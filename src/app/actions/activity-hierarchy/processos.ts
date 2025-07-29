"use server";

import { createClient } from "@/utils/supabase/server";
import { NewProcesso } from "@/types/activity-hierarchy/processo";

export async function createProcesso(
    processo: NewProcesso
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("processo")
            .insert([processo])
            .select("*");

        if (error) {
            console.error("Erro ao criar macroprocesso:", error);
            throw new Error("Erro ao criar macroprocesso: " + error.message);
        }

        return data[0];
    } catch (error) {
        console.error("Erro ao criar macroprocesso:", error);
        throw new Error("Erro desconhecido ao criar macroprocesso. Entrar em contato com o suporte.");
    }
}

export async function getProcessos() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("processo")
            .select("*")
            .order("nome", { ascending: true });


        if (error) {
            console.error("Erro ao buscar macroprocessos:", error);
            throw new Error("Erro ao buscar macroprocessos: " + error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao obter macroprocessos:", error);
        throw new Error("Erro desconhecido ao obter macroprocessos. Entrar em contato com o suporte.");
    }
}

export async function deleteMacroprocesso(id: number) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("macroprocessos")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao deletar macroprocesso:", error);
            throw new Error("Erro ao deletar macroprocesso: " + error.message);
        }

        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar macroprocesso:", error);
        throw new Error("Erro desconhecido ao deletar macroprocesso. Entrar em contato com o suporte.");
    }
}