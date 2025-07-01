"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { NewTimeAllocation } from "@/types/time-sheet/time-allocation";


type Summary = { total_allocated: number; daily_target: number };

// 1) resumo diario
export async function getAllocationSummary(
    userId: string,
    allocationDate: string
): Promise<Summary> {
    const supabase = await createClient();

    // total alocaco do dia
    const { data: sumData, error: sumErr } = await supabase
        .from("time_allocations")
        .select("hours", { count: "exact" })
        .eq("user_id", userId)
        .eq("allocation_date", allocationDate)
    if (sumErr) {
        console.error("Erro ao buscar resumo de alocação:", sumErr);
        throw new Error(`Erro ao buscar resumo de alocação: ${sumErr.message}`);
    }

    const total_allocated = sumData?.reduce((acc, r) => acc + Number(r.hours), 0) ?? 0;


    // meta diaria do usuário
    const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("working_hours_per_day")
        .eq("id", userId)
        .single();

    if (userErr || !userData) {
        console.error("Erro ao buscar meta diária do usuário:", userErr);
        throw new Error(`Erro ao buscar meta diária do usuário: ${userErr.message}`);
    }

    const daily_target = userData.working_hours_per_day;

    return { total_allocated, daily_target }
}


// 2) projetos do usuário (considerando user_departments)
export async function getUserProjects(userId: string) {
    const supabase = await createClient();

    // busca departamentos
    const { data: deps, error: depErr } = await supabase
        .from("user_departments")
        .select("department_id")
        .eq("user_id", userId);

    if (depErr) throw new Error(depErr.message);

    // se não tem deps, retorna vazio
    const deptIds = deps?.map((d) => d.department_id) ?? [];
    // adcionando a id 8 na lista de departamentos id se ja não estiver
    if (!deptIds.includes("8")) {
        deptIds.push("8");
    }

    // busca projetos ativos nesses deps
    const { data: projects, error: projErr } = await supabase
        .from("projects")
        .select("id, name, department_id")
        .in("department_id", deptIds)
        .eq("status", "ativo");

    if (projErr) throw new Error(projErr.message);

    return projects ?? [];
}

// 3) atividades de um projeto (filtrado pelo mesmo department_id)
export async function getProjectActivities(departmentId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("activities")
        .select("id, name")
        .eq("department_id", departmentId)
        .eq("status", "ativo");

    if (error) throw new Error(error.message);
    return data ?? [];
}

// 4) inserir nova alocação
export async function createTimeAllocation(
    userId: string,
    allocation: NewTimeAllocation
) {
    const supabase = await createClient();

    const payload = {
        user_id: userId,
        project_id: Number(allocation.project_id),
        activity_id: Number(allocation.activity_id),
        allocation_date: allocation.allocation_date,
        hours: allocation.hours,
        comment: allocation.comment,
    };

    const { error } = await supabase
        .from("time_allocations")
        .insert([payload]);

    if (error) throw new Error(error.message);

    // revalida a rota pra atualizar o resumo
    revalidatePath("/controle-horarios/alocar-horas");
}