"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// reset password
export async function resetPassword(formData: FormData, code: string) {
  const supabase = await createClient();
  const { error: CodeError } = await supabase.auth.exchangeCodeForSession(code);

  if (CodeError) {
    return {
      status: CodeError?.message,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.get("password") as string,
  });

  if (error) {
    return {
      status: error?.message,
    };
  }

  return { status: "success" };
}
// forgot password
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return {
      status: error?.message,
      user: null,
    };
  }

  return { status: "success" };
}

//logiun
export async function Login(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      return {
        error: "Informe e-mail e senha.",
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Erro real do Supabase no login:", {
        name: error.name,
        message: error.message,
        status: error.status,
      })

      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        return {
          error: "E-mail ou senha inválidos.",
        }
      }

      if (error.message?.toLowerCase().includes("email not confirmed")) {
        return {
          error: "E-mail ainda não confirmado no Supabase.",
        }
      }

      if (error.message?.toLowerCase().includes("fetch failed")) {
        return {
          error:
            "Falha de conexão com o Supabase. Verifique internet, DNS, VPN, firewall ou .env.local.",
        }
      }

      return {
        error: `Erro do Supabase: ${error.message}`,
      }
    }

    if (!data.session) {
      return {
        error: "O login foi aceito, mas o Supabase não retornou sessão.",
      }
    }

    revalidatePath("/", "layout")

    return {
      success: "Login realizado!",
    }
  } catch (error) {
    console.error("Falha inesperada no login:", error)

    return {
      error:
        "Falha de conexão com o Supabase. Verifique internet, DNS, VPN, firewall ou .env.local.",
    }
  }
}

export async function loginWithToken(token: string) {
  const supabase = await createClient();
  // Exchange the token for a session
  const { error } = await supabase.auth.exchangeCodeForSession(token);

  if (error) {
    return { error: 'Falha ao fazer login.' };
  }

  revalidatePath('/', 'layout');
  return { success: 'Login Realizado!' };
}


import { getUser } from "@/hooks/use-user";

export async function getUserSession() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return { status: 'success', user: user };
}
