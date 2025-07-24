"use server";
import { createClient } from "@/utils/supabase/server";
import { EnpsCreateSchema } from "@/types/satisfacao/enps";

export async function criarEnps(
    prevState: unknown, // você pode tipar melhor se quiser
    formData: FormData
) {
    const supabase = await createClient();

    const feedbackData = {
        ano: formData.get("ano"),
        periodo: formData.get("periodo"),
    };

    const parsedData = EnpsCreateSchema.safeParse(feedbackData);

    if (!parsedData.success) {
        return { error: parsedData.error.format() };
    }

    const { error } = await supabase.from('enps').insert(parsedData.data);

    if (error) {
        return { error: error.message };
    }

    return { success: true, ano: parsedData.data.ano, periodo: parsedData.data.periodo };
}


export async function fetchAllEnps() {
    const supabase = await createClient()

    const data = await supabase.from('enps').select('*').is('department', null)

    return data
}

export async function fetchEnpsAtivo(ano: string, periodo: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('enps')
        .select('*')
        .eq('status', 'TRUE')
        .not('department', 'is', null)
        .eq('ano', ano)
        .eq('periodo', periodo)

    if (error) {
        throw new Error(error.message)
    }

    return data
    }