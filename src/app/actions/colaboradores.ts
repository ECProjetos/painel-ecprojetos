"use server"

import { supabaseAdmin } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { ColaboradorUpdate } from "@/types/colaboradores"
import { roles } from "@/constants/roles"

async function ensureDiretorPermission() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (roleError || !currentUser) {
    throw new Error("Não foi possível validar a permissão do usuário.")
  }

  if (currentUser.role !== roles.diretor) {
    throw new Error("Apenas diretores podem alterar ou remover colaboradores.")
  }

  return user
}

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
  await ensureDiretorPermission()

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/colaboradores`, {
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
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao criar colaborador")
  }

  return res.json()
}

export async function updateColaborador(id: string, data: ColaboradorUpdate) {
  await ensureDiretorPermission()

  const userPayload: Record<string, unknown> = {}

  if (data.nome !== undefined) userPayload.nome = data.nome
  if (data.email !== undefined) userPayload.email = data.email
  if (data.cargoId !== undefined) userPayload.cargo_id = data.cargoId
  if (data.role !== undefined) userPayload.role = data.role
  if (data.working_hours_per_day !== undefined) {
    userPayload.working_hours_per_day = data.working_hours_per_day
  }
  if (data.status !== undefined) userPayload.status = data.status

  if (data.endereco !== undefined) userPayload.endereco = data.endereco
  if (data.cep !== undefined) userPayload.cep = data.cep
  if (data.cidade !== undefined) userPayload.cidade = data.cidade
  if (data.estado !== undefined) userPayload.estado = data.estado
  if (data.telefone !== undefined) userPayload.telefone = data.telefone
  if (data.data_nascimento !== undefined) userPayload.data_nascimento = data.data_nascimento
  if (data.naturalidade !== undefined) userPayload.naturalidade = data.naturalidade
  if (data.grau_escolaridade !== undefined) {
    userPayload.grau_escolaridade = data.grau_escolaridade
  }
  if (data.pis !== undefined) userPayload.pis = data.pis
  if (data.cpf !== undefined) userPayload.cpf = data.cpf
  if (data.rg !== undefined) userPayload.rg = data.rg
  if (data.orgao_emissor !== undefined) userPayload.orgao_emissor = data.orgao_emissor
  if (data.uf_rg !== undefined) userPayload.uf_rg = data.uf_rg
  if (data.data_admissao !== undefined) userPayload.data_admissao = data.data_admissao
  if (data.horario !== undefined) userPayload.horario = data.horario

  if (Object.keys(userPayload).length > 0) {
    const { error } = await supabaseAdmin.from("users").update(userPayload).eq("id", id)

    if (error) {
      console.error("Erro ao atualizar users:", error)
      throw new Error(error.message)
    }
  }

  if (data.departamentoId !== undefined) {
    const { data: existingDept, error: deptSearchError } = await supabaseAdmin
      .from("user_departments")
      .select("user_id")
      .eq("user_id", id)
      .maybeSingle()

    if (deptSearchError) {
      console.error("Erro ao buscar departamento do colaborador:", deptSearchError)
      throw new Error(deptSearchError.message)
    }

    if (existingDept) {
      const { error: deptUpdateError } = await supabaseAdmin
        .from("user_departments")
        .update({ department_id: data.departamentoId })
        .eq("user_id", id)

      if (deptUpdateError) {
        console.error("Erro ao atualizar departamento:", deptUpdateError)
        throw new Error(deptUpdateError.message)
      }
    } else {
      const { error: deptInsertError } = await supabaseAdmin
        .from("user_departments")
        .insert({ user_id: id, department_id: data.departamentoId })

      if (deptInsertError) {
        console.error("Erro ao inserir departamento:", deptInsertError)
        throw new Error(deptInsertError.message)
      }
    }
  }

  if (data.email !== undefined) {
    const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: data.email,
    })

    if (authEmailError) {
      console.error("Erro ao atualizar email no Auth:", authEmailError)
      throw new Error(authEmailError.message)
    }
  }

  return { success: true }
}

export async function deleteColaborador(id: string) {
  await ensureDiretorPermission()

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/colaboradores`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao deletar colaborador")
  }

  return res.json()
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

export async function getColaboradoresByDepartamento(nome_departamento: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("*")
    .eq("departamento_nome", nome_departamento)
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores por departamento:", error)
    throw new Error(error.message)
  }

  return data
}

export async function getDepartamentoByID(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erro ao buscar departamento por ID:", error)
    throw new Error(error.message)
  }

  return data
}

export async function getColaboradorById(id: string) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (userError) {
    throw new Error(userError.message)
  }

  const { data: userDepartment, error: depError } = await supabase
    .from("user_departments")
    .select("department_id")
    .eq("user_id", id)
    .maybeSingle()

  if (depError) {
    throw new Error(depError.message)
  }

  return {
    ...userData,
    departamentoId: userDepartment?.department_id ?? null,
  }
}