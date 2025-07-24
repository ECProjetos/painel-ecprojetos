"use server";

import { createClient } from "@/utils/supabase/server";
import { TimeEntryFormValues } from "@/types/inicio/ponto";

type SendTimeEntryResult =
    | { success: true }
    | { success: false; error: string };

export async function sendTimeEntry(
    formData: TimeEntryFormValues
): Promise<SendTimeEntryResult> {
    // inicializa Supabase no contexto de Server Action
    const supabase = await createClient();

    // obtém usuário logado
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const { entry_date, period, entry_time, exit_time, allocations } =
        formData;

    // 1) Upsert em time_entries
    const { error: entryError } = await supabase
        .from("time_entries")
        .upsert(
            {
                user_id: user.id,
                entry_date,
                period,
                entry_time,
                exit_time,
            },
            { onConflict: "user_id,entry_date,period" }
        );
    if (entryError) {
        return { success: false, error: entryError.message };
    }

    // 2) Remove alocações antigas para esta data do usuário
    const { error: deleteError } = await supabase
        .from("time_allocations")
        .delete()
        .eq("user_id", user.id)
        .eq("allocation_date", entry_date);
    if (deleteError) {
        return { success: false, error: deleteError.message };
    }

    // 3) Insere as novas alocações
    const allocationsToInsert = allocations.map((a) => ({
        user_id: user.id,
        project_id: a.project_id,
        activity_id: a.activity_id,
        allocation_date: entry_date,
        hours: a.hours,
        comment: a.comment ?? null,
    }));
    const { error: allocError } = await supabase
        .from("time_allocations")
        .insert(allocationsToInsert);
    if (allocError) {
        return { success: false, error: allocError.message };
    }

    return { success: true };
}
