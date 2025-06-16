// src/app/actions/colaboradores.ts
"use client";

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
