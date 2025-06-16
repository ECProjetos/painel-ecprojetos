'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserRole } from '@/hooks/use-role'

export async function POST(request: Request) {
    try {
        // Verifica se o usuário está autenticado e autorizado
        const authResponse = await getAuthenticatedUserRole()
        if (authResponse.status !== 200) {
            return authResponse
        }

        // Obtém os dados do corpo da requisição
        // // nome: "",
        //       email: "",
        //       cargoId: undefined as unknown as number,
        //       departamentoId: undefined as unknown as number,
        //       role: rolesListDynamic[0]?.value as NewColaborador["role"],
        //       working_hours_per_day: 0,
        //       status: "ativo",
        //       password: "",
        //       confirmPassword: "",
        const { nome, email, senha, cargoId, departamentoId, role, working_hours_per_day, password } = await request.json()


}