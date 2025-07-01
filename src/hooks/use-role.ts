'use server'

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { roles } from '@/constants/roles'

export async function getAuthenticatedUserRole() {
    try {

        const supabaseAdmin = await createClient()
        //verefica se o usuário está autenticado
        const { data: { user } } = await supabaseAdmin.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
        }
        // verefica se o usuário tem a role de GESTOR ou DIRETOR
        const { data: role, error: roleError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (roleError || !role) {
            return NextResponse.json({ error: 'Erro ao verificar role do usuário' }, { status: 500 })
        }


        // Se o usuário não for um GESTOR ou DIRETOR, retorna erro
        if (role.role !== roles.gestor && role.role !== roles.diretor) {
            return NextResponse.json({ error: 'Usuário não tem permissão para criar colaboradores' }, { status: 403 })
        }
        // Se o usuário for um GESTOR ou DIRETOR, retorna sucesso
        return NextResponse.json({ message: 'Usuário autenticado e autorizado' }, { status: 200 })
    } catch (error) {
        console.error('Erro ao verificar autenticação e autorização do usuário:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}