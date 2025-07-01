"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NewProject } from "@/types/projects";

export async function createProject(project: NewProject) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("projects")
            .insert([project])

        if (error?.code === "23505") {
            // Erro de chave única, significa que o projeto já existe   
            throw new Error("Projeto já existe com o mesmo código.");
        } else if (error) {
            console.error("Erro ao inserir projeto:", error);
            throw new Error("Erro ao inserir projeto: " + error.message);
        }
        // Revalidar o caminho para atualizar a lista de projetos
        revalidatePath("/controle-horarios/direcao/projetos");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao criar projeto:", error);
        throw new Error(error.message || "Erro desconhecido ao criar projeto. Entrar em contato com o suporte.");
    }
}

export async function getAllProjects() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("project_time_summary")
            .select("*")
            .order("name", { ascending: false });

        if (error) {
            console.error("Erro ao buscar projetos:", error);
            throw new Error("Erro ao buscar projetos: " + error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao obter projetos:", error);
        throw new Error("Erro desconhecido ao obter projetos. Entrar em contato com o suporte.");
    }
}

export async function getProjectById(id: number) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Erro ao buscar projeto:", error);
            throw new Error("Erro ao buscar projeto: " + error.message);
        }

        return data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao obter projeto:", error);
        throw new Error(error.message || "Erro desconhecido ao obter projeto. Entrar em contato com o suporte.");
    }
}

export async function updateProject(id: number, project: NewProject) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("projects")
            .update(project)
            .eq("id", id);

        if (error) {
            console.error("Erro ao atualizar projeto:", error);
            throw new Error("Erro ao atualizar projeto: " + error.message);
        }

        // Revalidar o caminho para atualizar a lista de projetos
        revalidatePath("/controle-horarios/direcao/projetos");

    } catch (error) {
        console.error("Erro ao atualizar projeto:", error);
        throw new Error("Erro desconhecido ao atualizar projeto. Entrar em contato com o suporte.");
    }
}

export async function deletProject(id: number) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir projeto:", error);
            throw new Error("Erro ao excluir projeto: " + error.message);
        }

        // Revalidar o caminho para atualizar a lista de projetos
        revalidatePath("/controle-horarios/direcao/projetos");

    } catch (error) {
        console.error("Erro ao excluir projeto:", error);
        throw new Error("Erro desconhecido ao excluir projeto. Entrar em contato com o suporte.");
    }
}