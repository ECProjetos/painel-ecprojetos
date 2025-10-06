"use server"

import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import { ColaboradorUpdate } from "@/types/colaboradores"

export async function createColaborador(
  nome: string,
  email: string,
  cargoId: number,
  departamentoId: number,
  role: string,
  working_hours_per_day: number,
  status: string,
  password: string,
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
    },
  )

  // Lança exceção para status >= 400
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao criar colaborador")
  }

  // Nesse caso retorna o corpo JSON para quem chamou
  return res.json()
}

export async function updateColaborador(id: string, data: ColaboradorUpdate) {
  const supabase = await createClient()

  // 1) Monta apenas os campos de users que vieram no data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPayload: Record<string, any> = {}
  if (data.nome !== undefined) userPayload.name = data.nome
  if (data.email !== undefined) userPayload.email = data.email
  if (data.cargoId !== undefined) userPayload.cargo_id = data.cargoId
  if (data.role !== undefined) userPayload.role = data.role
  if (data.working_hours_per_day !== undefined)
    userPayload.working_hours_per_day = data.working_hours_per_day
  if (data.status !== undefined) userPayload.status = data.status

  // 2) Atualiza tabela "users" se houver algo para alterar
  if (Object.keys(userPayload).length > 0) {
    const { error: userError } = await supabase
      .from("users")
      .update(userPayload)
      .eq("id", id)

    if (userError) {
      console.error("Erro ao atualizar users:", userError)
      throw new Error(userError.message)
    }
  }

  // 3) Se veio departamentoId, faz upsert (sem delete) em user_departments
  if (data.departamentoId !== undefined) {
    const deptRow = await supabase
      .from("user_departments")
      .select("user_id")
      .eq("user_id", id)
      .maybeSingle()

    if (deptRow.data) {
      // já existe, faz update
      const { error: updError } = await supabase
        .from("user_departments")
        .update({ department_id: data.departamentoId })
        .eq("user_id", id)
      if (updError) {
        console.error("Erro ao atualizar dept:", updError)
        throw new Error(updError.message)
      }
    } else {
      // não existia, insere novo
      const { error: insError } = await supabase
        .from("user_departments")
        .insert({ user_id: id, department_id: data.departamentoId })
      if (insError) {
        console.error("Erro ao inserir dept:", insError)
        throw new Error(insError.message)
      }
    }
  }

  return { success: true }
}

export async function updateColaboradorEmail(id: string, email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: email,
    })

    if (error) {
      console.error("Erro ao atualizar email do colaborador:", error)
      throw new Error(error.message)
    }

    // Atualiza o email na tabela users
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: email })
      .eq("id", id)
    if (updateError) {
      console.error("Erro ao atualizar email na tabela users:", updateError)
      throw new Error(updateError.message)
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error)
    throw error
  }
}

export async function updateColaboradorPassword(id: string, password: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password,
    })

    if (error) {
      console.error("Erro ao atualizar senha do colaborador:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error)
    throw error
  }
}

export async function getAllColaboradores() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("*")
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error(error.message)
  }

  return data
}

export async function getColaboradorById(id: string) {
  try {
    const supabase = await createClient()

    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()
    if (error) {
      throw new Error(error.message)
    }

    const { data: userDepartament, error: depError } = await supabase
      .from("user_departments")
      .select("department_id")
      .eq("user_id", id)
      .single()
    if (depError) {
      console.error("Erro ao buscar departamento do colaborador:", depError)
      throw new Error(depError.message)
    }

    const data = {
      ...userData,
      departamentoId: userDepartament ? userDepartament.department_id : null,
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar colaborador:", error)
    throw error
  }
}

export async function deleteColaborador(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/colaboradores`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    },
  )
  // Lança exceção para status >= 400
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao deletar colaborador")
  }

  // Nesse caso retorna o corpo JSON para quem chamou
  return res.json()
}

export async function getDepartamentoByID(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("nome_departamento")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erro ao buscar departamento:", error)
    throw new Error(error.message)
  }

  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getColaboradoresByDepartamento(nome_departamento: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("*")
    .eq("nome_departamento", nome_departamento)
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error(error.message)
  }

  return data
}
