'use server';

import { Project } from "@/types/projects";
import { createClient } from "@/utils/supabase/server";

export async function fetchProjects(): Promise<Project[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      code,
      description,
      department_id,
      status,
      estimated_hours,
      departments (
        name
      )
    `);

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((proj: any) => ({
        id: proj.id,
        name: proj.name,
        code: proj.code,
        description: proj.description,
        department_id: proj.department_id,
        status: proj.status,
        estimated_hours: proj.estimated_hours,
        department_name: proj.departments?.name ?? '',
    }));
}
