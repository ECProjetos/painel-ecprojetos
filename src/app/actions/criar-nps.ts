"use server";
import { createClient } from "@/utils/supabase/server";
import { NpsCreateSchema } from "@/types/satisfacao/nps";

export async function criarNps(
    prevState: unknown, // você pode tipar melhor se quiser
    formData: FormData
) {
    const supabase = await createClient();

    const feedbackData = {
        cliente: formData.get("cliente"),
        projeto: formData.get("projeto"),
    };

    const parsedData = NpsCreateSchema.safeParse(feedbackData);

    if (!parsedData.success) {
        return { error: parsedData.error.format() };
    }

    const { error } = await supabase.from('satisfacao_clientes').insert(parsedData.data);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function fetchAllNps() {
    const supabase = await createClient()

    const data = await supabase.from('satisfacao_clientes').select('*')

    return data
}