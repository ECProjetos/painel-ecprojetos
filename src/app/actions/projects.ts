/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NewProject } from "@/types/projects";

// CRIAR projeto com múltiplos departamentos
export async function createProject(project: NewProject) {
  try {
    const supabase = await createClient();
    const { department_ids, ...projectData } = project;

    // Inserir o projeto e retornar o ID
    const { data, error: projectError } = await supabase
      .from("projects")
      .insert([projectData])
      .select("id")
      .single();

    if (projectError?.code === "23505") {
      throw new Error("Projeto já existe com o mesmo código.");
    } else if (projectError) {
      throw new Error("Erro ao inserir projeto: " + projectError.message);
    }

    const projectId = data.id;

    // Inserir os departamentos relacionados
    const { error: relError } = await supabase
      .from("project_departments")
      .insert(
        department_ids.map((department_id) => ({
          project_id: projectId,
          department_id,
        }))
      );

    if (relError) {
      throw new Error("Erro ao relacionar departamentos: " + relError.message);
    }

    revalidatePath("/controle-horarios/direcao/projetos");

  } catch (error: any) {
    console.error("Erro ao criar projeto:", error);
    throw new Error(error.message || "Erro desconhecido ao criar projeto.");
  }
}

// OBTER todos os projetos (da view com horas, se aplicável)
export async function getAllProjects() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_time_summary")
      .select("*")
      .order("name", { ascending: false });

    if (error) {
      throw new Error("Erro ao buscar projetos: " + error.message);
    }

    return data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Erro desconhecido ao obter projetos.");
  }
}

// OBTER projeto por ID
export async function getProjectById(id: number) {
  try {
    const supabase = await createClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError) {
      throw new Error("Erro ao buscar projeto: " + projectError.message);
    }

    // Buscar os departamentos relacionados
    const { data: departments, error: depError } = await supabase
      .from("project_departments")
      .select("department_id")
      .eq("project_id", id);

    if (depError) {
      throw new Error("Erro ao buscar departamentos do projeto: " + depError.message);
    }

    return {
      ...project,
      department_ids: departments.map((d) => d.department_id),
    };
  } catch (error: any) {
    throw new Error(error.message || "Erro desconhecido ao obter projeto.");
  }
}

// ATUALIZAR projeto com múltiplos departamentos
export async function updateProject(id: number, project: NewProject) {
  try {
    const supabase = await createClient();
    const { department_ids, ...projectData } = project;

    // Atualizar projeto
    const { error: updateError } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", id);

    if (updateError) {
      throw new Error("Erro ao atualizar projeto: " + updateError.message);
    }

    // Limpar relações antigas
    const { error: deleteError } = await supabase
      .from("project_departments")
      .delete()
      .eq("project_id", id);

    if (deleteError) {
      throw new Error("Erro ao remover departamentos antigos: " + deleteError.message);
    }

    // Inserir novas relações
    const { error: insertError } = await supabase
      .from("project_departments")
      .insert(
        department_ids.map((department_id) => ({
          project_id: id,
          department_id,
        }))
      );

    if (insertError) {
      throw new Error("Erro ao atualizar departamentos: " + insertError.message);
    }

    revalidatePath("/controle-horarios/direcao/projetos");

  } catch (error: any) {
    throw new Error(error.message || "Erro desconhecido ao atualizar projeto.");
  }
}

// DELETAR projeto
export async function deletProject(id: number) {
  try {
    const supabase = await createClient();

    // Apagar relações antes (por segurança referencial)
    await supabase
      .from("project_departments")
      .delete()
      .eq("project_id", id);

    // Apagar o projeto
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error("Erro ao excluir projeto: " + error.message);
    }

    revalidatePath("/controle-horarios/direcao/projetos");

  } catch (error: any) {
    throw new Error(error.message || "Erro desconhecido ao excluir projeto.");
  }
}
