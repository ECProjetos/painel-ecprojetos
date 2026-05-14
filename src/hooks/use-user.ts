"use server"

import { createClient } from "@/utils/supabase/server"

export async function getUser() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Erro ao buscar usuário autenticado:", userError)
      return null
    }

    if (!user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, nome")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError)
      return null
    }

    return {
      ...user,
      role: profile?.role,
      name: profile?.nome,
    }
  } catch (error) {
    console.error("Falha de conexão com o Supabase em getUser:", error)
    return null
  }
}