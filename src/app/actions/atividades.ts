"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NewAtividade } from "@/types/atidades";

export async function createAtividade(atividade: NewAtividade) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("activities")
            .insert([atividade]);

        if (error?.code === "23505") {
            // Erro de chave única, significa que a atividade já existe   
            throw new Error("Atividade já existe com o mesmo nome.");
        } else if (error) {
            console.error("Erro ao inserir atividade:", error);
            throw new Error("Erro ao inserir atividade: " + error.message);
        }
        // Revalidar o caminho para atualizar a lista de atividades
        revalidatePath("/controle-horarios/direcao/atividades");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao criar atividade:", error);
        throw new Error(error.message || "Erro desconhecido ao criar atividade. Entrar em contato com o suporte.");
    }
}

export async function getAllAtividades() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("vw_activities_with_department")
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
