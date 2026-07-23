import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"

export async function getFeedbackCurrentUserRole() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/")
  }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error || !data?.role) {
    console.error("Erro ao verificar permissão de feedback:", error)
    redirect("/controle-horarios/inicio")
  }

  return String(data.role).toUpperCase()
}

/**
 * Permite histórico, análise e gestão somente para DIRETOR ou ADMIN.
 *
 * Gestores e colaboradores são enviados para a área de respostas.
 */
export async function requireFeedbackManagementAccess() {
  const role = await getFeedbackCurrentUserRole()

  const permitido = role === "DIRETOR" || role === "ADMIN"

  if (!permitido) {
    redirect("/feedback-interno/responder")
  }

  return role
}