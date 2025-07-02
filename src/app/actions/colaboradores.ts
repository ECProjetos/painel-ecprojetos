"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from '@/utils/supabase/admin'

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

export async function updateColaboradorEmail(
    id: string,
    email: string
) {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
            email: email,
        }
        );

        if (error) {
            console.error("Erro ao atualizar email do colaborador:", error);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao atualizar colaborador:", error);
        throw error;
    }

}

export async function updateColaboradorPassword(
    id: string,
    password: string
) {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: password,
        });

        if (error) {
            console.error("Erro ao atualizar senha do colaborador:", error);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        console.error("Erro ao atualizar colaborador:", error);
        throw error;
    }
}

export async function getAllColaboradores() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vw_colaboradores')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao buscar colaboradores:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function getColaboradorById(id: string) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    } catch (error) {
        console.error("Erro ao buscar colaborador:", error);
        throw error;
    }
}

export async function deleteColaborador(id: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/colaboradores`,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        }
    );
    // Lança exceção para status >= 400
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao deletar colaborador");
    }

    // Nesse caso retorna o corpo JSON para quem chamou
    return res.json();
}




