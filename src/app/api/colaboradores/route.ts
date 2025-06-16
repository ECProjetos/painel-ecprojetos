'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserRole } from '@/hooks/use-role'

export async function POST(request: Request) {
    try {
        // Verifica se o usuário está autenticado e autorizado
        const authResponse = await getAuthenticatedUserRole()
        console.log('authResponse', authResponse)
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
        const { nome, email, cargoId, departamentoId, role, working_hours_per_day, password } = await request.json()

        // cria um novo usuário supabase admin
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (userError) {
            console.error('Erro ao criar usuário Supabase:', userError)
            return NextResponse.json({ error: 'Erro ao criar usuário Supabase' }, { status: 500 })
        }

        const userId = user?.user?.id

        // Insere o novo colaborador na tabela 'users'
        const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: userId,
                name: nome,
                email,
                role,
                working_hours_per_day,
                status: 'ativo',
                cargo_id: cargoId,
            })
        if (insertError) {
            console.error('Erro ao inserir colaborador:', insertError)
            return NextResponse.json({ error: 'Erro ao inserir colaborador' }, { status: 500 })
        }
        // criar relação entra o usuário e o departamento na tabela user_departments

        const { error: departmentError } = await supabaseAdmin
            .from('user_departments')
            .insert({
                user_id: userId,
                department_id: departamentoId,
            })

        if (departmentError) {
            console.error('Erro ao inserir departamento do colaborador:', departmentError)
            return NextResponse.json({ error: 'Erro ao inserir departamento do colaborador' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Colaborador criado com sucesso' }, { status: 201 })
    } catch (error) {
        console.error('Erro ao criar colaborador:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}