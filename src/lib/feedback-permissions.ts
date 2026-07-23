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

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (
    perfilError ||
    !perfil ||
    String(perfil.role).toUpperCase() !== "DIRETOR"
  ) {
    redirect("/feedback-interno/responder")
  }
}