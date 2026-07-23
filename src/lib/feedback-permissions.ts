import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"

export async function requireFeedbackManagementAccess() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const { data: usuario, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Erro ao verificar permissão do feedback:", error)
    redirect("/feedback-interno/responder")
  }

  const role = String(usuario?.role ?? "").toUpperCase()

  const permitido = role === "DIRETOR" || role === "ADMIN"

  if (!permitido) {
    redirect("/feedback-interno/responder")
  }

  return role
}