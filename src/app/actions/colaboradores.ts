"use server";

import { createClient } from "@/utils/supabase/server";

export async function createColaborador(
    nome: string,
    email: string,
    cargoId: number,
    departamentoId: number,
    role: string,
    working_hours_per_day: number,
    status: string,
    password: string
) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/colaboradores`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                email,
                cargoId,
                departamentoId,
                role,
                working_hours_per_day,
                status,
                password,
            }),
        }
    );

    // Lança exceção para status >= 400
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao criar colaborador");
    }

    // Nesse caso retorna o corpo JSON para quem chamou
    return res.json();
}


export async function getAllColaboradores() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('vw_user_info')
            .select('*')
            .order('nome', { ascending: true });
        if (error) {
            throw new Error(error.message);
        }
        console.log("Colaboradores:", data);
        return data;
    } catch (error) {
        console.error("Erro ao buscar colaboradores:", error);
        throw error;
    }
} 