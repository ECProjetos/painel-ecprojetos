import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { roles } from "@/constants/roles"

async function ensureDiretorPermission() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Usuário não autenticado", status: 401 as const }
  }

  const { data: currentUser, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (roleError || !currentUser) {
    return { error: "Erro ao verificar permissão do usuário", status: 500 as const }
  }

  if (currentUser.role !== roles.diretor) {
    return { error: "Apenas diretores podem gerenciar colaboradores", status: 403 as const }
  }

  return { ok: true as const }
}

export async function POST(request: Request) {
  try {
    const permission = await ensureDiretorPermission()
    if ("error" in permission) {
      return NextResponse.json({ error: permission.error }, { status: permission.status })
    }

    const {
      nome,
      email,
      cargoId,
      departamentoId,
      role,
      working_hours_per_day,
      status,
      password,
    } = await request.json()

    const { data: authUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createAuthError || !authUser.user) {
      console.error("Erro ao criar usuário no Auth:", createAuthError)
      return NextResponse.json(
        { error: createAuthError?.message || "Erro ao criar usuário no Auth" },
        { status: 500 },
      )
    }

    const userId = authUser.user.id

    const { error: insertUserError } = await supabaseAdmin.from("users").insert({
      id: userId,
      nome,
      email,
      role,
      working_hours_per_day,
      status: status ?? "ativo",
      cargo_id: cargoId,
    })

    if (insertUserError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error("Erro ao inserir colaborador:", insertUserError)
      return NextResponse.json(
        { error: insertUserError.message || "Erro ao inserir colaborador" },
        { status: 500 },
      )
    }

    if (departamentoId) {
      const { error: departmentError } = await supabaseAdmin
        .from("user_departments")
        .insert({
          user_id: userId,
          department_id: departamentoId,
        })

      if (departmentError) {
        await supabaseAdmin.from("users").delete().eq("id", userId)
        await supabaseAdmin.auth.admin.deleteUser(userId)

        console.error("Erro ao inserir departamento do colaborador:", departmentError)
        return NextResponse.json(
          { error: departmentError.message || "Erro ao inserir departamento" },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Colaborador criado com sucesso" },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar colaborador:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await ensureDiretorPermission()
    if ("error" in permission) {
      return NextResponse.json({ error: permission.error }, { status: permission.status })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "ID do colaborador é obrigatório" },
        { status: 400 },
      )
    }

    const { error: deptError } = await supabaseAdmin
      .from("user_departments")
      .delete()
      .eq("user_id", id)

    if (deptError) {
      console.error("Erro ao deletar vínculo de departamento:", deptError)
      return NextResponse.json(
        { error: deptError.message || "Erro ao deletar vínculo do departamento" },
        { status: 500 },
      )
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id)

    if (userError) {
      console.error("Erro ao deletar colaborador da tabela users:", userError)
      return NextResponse.json(
        { error: userError.message || "Erro ao deletar colaborador" },
        { status: 500 },
      )
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authDeleteError) {
      console.error("Erro ao deletar colaborador do Auth:", authDeleteError)
      return NextResponse.json(
        { error: authDeleteError.message || "Erro ao deletar usuário do Auth" },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Colaborador deletado com sucesso" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Erro ao deletar colaborador:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}