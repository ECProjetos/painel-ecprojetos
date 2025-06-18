"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { TimeEntriesRow } from "@/types/time-sheet/time-entries-row";

export async function getStatusUsuario(userId: string) {
    const supabase = await createClient();
    const { data: entries, error: esmtriesError } = await supabase
        .from("time_entries")
        .select("entry_time")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(1);

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("banco_horas_atual")
        .eq("id", userId)
        .single();

    if (esmtriesError) {
        console.error("Error fetching time entries:", esmtriesError);
        throw new Error("Erro ao buscar as entradas de tempo.");
    }
    if (userError) {
        console.error("Error fetching user data:", userError);
        throw new Error("Erro ao buscar os dados do usuário.");
    }

    return {
        ultimaMarcacao: entries?.[0]?.entry_time || null,
        bancoHorasAtual: user?.banco_horas_atual || 0,
    };
}
export async function marcarPonto({
    userId,
    period,
    entry_time,
    exit_time,
}: {
    userId: string;
    period: 1 | 2 | 3;
    entry_time?: string;
    exit_time?: string;
}) {
    const supabase = await createClient();

    // data no formato YYYY-MM-DD
    const entry_date = new Date().toISOString().slice(0, 10);

    // monta só os campos definidos
    const payload: Partial<TimeEntriesRow> = {
        user_id: userId,
        entry_date,
        period,
        ...(entry_time !== undefined ? { entry_time } : {}),
        ...(exit_time !== undefined ? { exit_time } : {}),
    };

    const { error } = await supabase
        .from("time_entries")
        .upsert(payload, {
            onConflict: 'user_id,entry_date,period'

        });

    if (error) {
        console.error('Erro ao marcar ponto:', error);
        throw error;
    }

    revalidatePath('/controle-horarios/inicio');
}
export async function getPontoDoDia(userId: string) {
    const db = await createClient();
    const entry_date = new Date().toISOString().split("T")[0];
    const { data } = await db
        .from("time_entries")
        .select("period, entry_time, exit_time")
        .eq("user_id", userId)
        .eq("entry_date", entry_date)
        .order("period", { ascending: true });

    return data || [];
}

export async function getInsightsPontoHistorico(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("vw_user_month_summary")
        .select(
            "user_id, horas_previstas_no_mes, horas_trabalhadas_no_mes, banco_de_horas_inicial, ajuste_de_horas_do_mes, banco_de_horas_atual"
        )
        .eq("user_id", userId)
        .single();
    if (error) {
        console.error("Erro ao buscar insights do ponto:", error);
        throw new Error("Erro ao buscar insights do ponto.");
    }
    return {
        horasPrevistasNoMes: data?.horas_previstas_no_mes || 0,
        horasTrabalhadasNoMes: data?.horas_trabalhadas_no_mes || 0,
        bancoDeHorasInicial: data?.banco_de_horas_inicial || 0,
        ajusteDeHorasDoMes: data?.ajuste_de_horas_do_mes || 0,
        bancoDeHorasAtual: data?.banco_de_horas_atual || 0,
    };
}