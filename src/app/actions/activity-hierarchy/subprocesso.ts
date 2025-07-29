"use server";

import { createClient } from "@/utils/supabase/server";
import { NewSubProcesso } from "@/types/activity-hierarchy/sub-processo";

export async function createSubProcesso(
    subprocesso: NewSubProcesso
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("sub_processo")
            .insert([subprocesso])
            .select("*");

        if (error) {
            console.error("Erro ao criar processo:", error);
            throw new Error("Erro ao criar processo: " + error.message);
        }

        return data[0];
    } catch (error) {
        console.error("Erro ao criar processo:", error);
        throw new Error("Erro desconhecido ao criar processo. Entrar em contato com o suporte.");
    }
}

export async function getSubProcessos() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("sub_processo")
            .select("*")
            .order("nome", { ascending: true });

        console.log("SUBPROCESSOS", data)
        if (error) {
            console.error("Erro ao buscar sub-processo:", error);
            throw new Error("Erro ao buscar sub-processo: " + error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao obter sub-processo:", error);
        throw new Error("Erro desconhecido ao obter sub-processo. Entrar em contato com o suporte.");
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