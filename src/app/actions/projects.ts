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

        if (error) {
            console.error("Erro ao inserir projeto:", error);
            throw new Error("Erro ao inserir projeto: " + error.message);
        }
        // Revalidar o caminho para atualizar a lista de projetos
        revalidatePath("/controle-horarios/direcao/projetos");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao criar projeto:", error);
        throw new Error("Erro ao criar projeto: " + error.message);
    }
}