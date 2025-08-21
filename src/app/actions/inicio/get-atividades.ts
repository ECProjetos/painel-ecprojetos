'use server';

import { createClient } from '@/utils/supabase/server';


export async function getAtividades(){
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('activities')
        .select('*');

    if (error) {
        throw error;
    }

    return data;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAtividadesByProjectId({project_id}: {project_id:any})  {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("activities")
    .eq("id", project_id);

  if (projectsError) throw projectsError;

  console.log(projects);

  // Assuming activities is an array of ids in the first project
  const ids = projects && projects.length > 0 ? projects[0].activities ?? [] : [];
  const normalizedIds = Array.isArray(ids) ? ids.map((v) => Number(v)).filter(Number.isFinite) : [];

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .in("id", normalizedIds); // ou .in("id", normalizedIds)

  if (error) throw error;
  return data;
}
