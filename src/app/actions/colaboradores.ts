"use server"

import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import { ColaboradorUpdate } from "@/types/colaboradores"

type UserRow = {
  id: string
  nome: string
  email: string
  status: string | null
  working_hours_per_day: number | null
  cargos: { nome: string | null }[] | null
  user_departments: { departments: { name: string | null } | null }[] | null
}

type DepartamentoRow = {
  departments: { name: string | null } | null
}

type UserDepartamentoRow = {
  users: {
    id: string
    nome: string
    email: string
    status: string | null
    working_hours_per_day: number | null
    cargos: { nome: string | null }[] | null
  }
  departments: { name: string | null }
}

type UserUpdatePayload = Partial<{
  nome: string
  email: string
  cargo_id: number
  role: string
  working_hours_per_day: number
  status: string
}>

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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao criar colaborador")
  }

  return res.json()
}

export async function updateColaborador(id: string, data: ColaboradorUpdate) {
  const supabase = await createClient()

  const userPayload: UserUpdatePayload = {}

  if (data.nome !== undefined) userPayload.nome = data.nome
  if (data.email !== undefined) userPayload.email = data.email
  if (data.cargoId !== undefined) userPayload.cargo_id = data.cargoId
  if (data.role !== undefined) userPayload.role = data.role
  if (data.working_hours_per_day !== undefined)
    userPayload.working_hours_per_day = data.working_hours_per_day
  if (data.status !== undefined) userPayload.status = data.status

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

  if (data.departamentoId !== undefined) {
    const deptRow = await supabase
      .from("user_departments")
      .select("user_id")
      .eq("user_id", id)
      .maybeSingle()

    if (deptRow.error) {
      console.error("Erro ao buscar dept:", deptRow.error)
      throw new Error(deptRow.error.message)
    }

    if (deptRow.data) {
      const { error: updError } = await supabase
        .from("user_departments")
        .update({ department_id: data.departamentoId })
        .eq("user_id", id)
      if (updError) {
        console.error("Erro ao atualizar dept:", updError)
        throw new Error(updError.message)
      }
    } else {
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
      email,
    })

    if (error) {
      console.error("Erro ao atualizar email do colaborador:", error)
      throw new Error(error.message)
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email })
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
      password,
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
    .from("users")
    .select(
      `
      id,
      nome,
      email,
      status,
      working_hours_per_day,
      cargos ( nome ),
      user_departments (
        departments ( name )
      )
    `,
    )
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error(error.message)
  }

  const rows = (data ?? []) as UserRow[]

  return rows.map((u) => {
    const depName = u.user_departments?.[0]?.departments?.name ?? null
    const cargoName = u.cargos?.[0]?.nome ?? null

    const statusNormalizado =
      u.status === "active" || u.status === "ativo"
        ? "ativo"
        : u.status === "inactive" || u.status === "inativo"
          ? "inativo"
          : (u.status ?? "ativo")

    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      nome_departamento: depName,
      nome_cargo: cargoName,
      status: statusNormalizado,
      carga_horaria: u.working_hours_per_day ?? null,
      banco_horas_atual: null,
    }
  })
}

export async function getDepartamentoByID(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_departments")
    .select(`departments ( name )`)
    .eq("user_id", id)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar departamento:", error)
    throw new Error(error.message)
  }

  const row = data as DepartamentoRow | null

  return {
    nome_departamento: row?.departments?.name ?? null,
  }
}

export async function getColaboradoresByDepartamento(
  nome_departamento: string,
) {
  const supabase = await createClient()

  const { data: dep, error: depError } = await supabase
    .from("departments")
    .select("id")
    .eq("name", nome_departamento)
    .maybeSingle()

  if (depError) {
    console.error("Erro ao buscar department_id:", depError)
    throw new Error(depError.message)
  }

  if (!dep?.id) return []

  const { data, error } = await supabase
    .from("user_departments")
    .select(
      `
      users (
        id,
        nome,
        email,
        status,
        working_hours_per_day,
        cargos ( nome )
      ),
      departments ( name )
    `,
    )
    .eq("department_id", dep.id)

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error(error.message)
  }

  const rows = (data ?? []) as UserDepartamentoRow[]

  return rows
    .map((row) => {
      const u = row.users
      if (!u) return null

      const statusNormalizado =
        u.status === "active" || u.status === "ativo"
          ? "ativo"
          : u.status === "inactive" || u.status === "inativo"
            ? "inativo"
            : (u.status ?? "ativo")

      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        nome_departamento: row.departments?.name ?? null,
        nome_cargo: u.cargos?.nome ?? null,
        status: statusNormalizado,
        carga_horaria: u.working_hours_per_day ?? null,
        banco_horas_atual: null,
      }
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome))
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

    const merged = {
      ...userData,
      departamentoId: userDepartament ? userDepartament.department_id : null,
    }

    return merged
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao deletar colaborador")
  }

  return res.json()
}
