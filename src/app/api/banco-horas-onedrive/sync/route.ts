import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

type BancoHorasInput = {
  colaborador_nome?: string
  arquivo_nome?: string
  ano?: number | string
  mes?: number | string
  cadastro_usado?: string | null
  horas_semanais?: number | string | null
  horas_a_fazer_mes?: number | string | null
  horas_trabalhadas_mes?: number | string | null
  banco_horas_mes_anterior?: number | string | null
  horas_somadas_banco?: number | string | null
  banco_horas_atual?: number | string | null
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  const cleaned = String(value)
    .replace("h", "")
    .replace(",", ".")
    .trim()

  const number = Number(cleaned)

  return Number.isFinite(number) ? number : null
}

function toInteger(value: unknown) {
  const number = toNumber(value)

  if (number === null) return null

  return Math.trunc(number)
}

export async function POST(request: NextRequest) {
  try {
    const syncToken = process.env.ONEDRIVE_SYNC_TOKEN
    const receivedToken = request.headers.get("x-sync-token")

    if (!syncToken || receivedToken !== syncToken) {
      return NextResponse.json(
        { success: false, message: "Token de sincronização inválido." },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.",
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    })

    const body = await request.json()
    const rows = Array.isArray(body?.rows) ? (body.rows as BancoHorasInput[]) : []

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhuma linha recebida para importação." },
        { status: 400 }
      )
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, nome")

    if (usersError) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao buscar usuários.",
          error: usersError.message,
        },
        { status: 500 }
      )
    }

    const usersByName = new Map<string, string>()

    for (const user of users ?? []) {
      if (user.nome) {
        usersByName.set(normalizeName(user.nome), user.id)
      }
    }

    const payload = rows
      .map((row) => {
        const colaboradorNome = toText(row.colaborador_nome)
        const arquivoNome = toText(row.arquivo_nome)
        const ano = toInteger(row.ano)
        const mes = toInteger(row.mes)

        if (!colaboradorNome || !arquivoNome || !ano || !mes) {
          return null
        }

        const mesReferencia = `${ano}-${String(mes).padStart(2, "0")}-01`
        const userId = usersByName.get(normalizeName(colaboradorNome)) ?? null

        return {
          user_id: userId,
          colaborador_nome: colaboradorNome,
          arquivo_nome: arquivoNome,
          ano,
          mes,
          mes_referencia: mesReferencia,
          cadastro_usado: row.cadastro_usado ?? null,
          horas_semanais: toNumber(row.horas_semanais),
          horas_a_fazer_mes: toNumber(row.horas_a_fazer_mes),
          horas_trabalhadas_mes: toNumber(row.horas_trabalhadas_mes),
          banco_horas_mes_anterior: toNumber(row.banco_horas_mes_anterior),
          horas_somadas_banco: toNumber(row.horas_somadas_banco),
          banco_horas_atual: toNumber(row.banco_horas_atual),
          origem: "sharepoint_onedrive",
          sincronizado_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
      .filter(Boolean)

    if (payload.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhuma linha válida foi encontrada para importação.",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("banco_horas_oficial_onedrive")
      .upsert(payload, {
        onConflict: "colaborador_nome,ano,mes",
      })
      .select()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao salvar banco de horas oficial.",
          error: error.message,
        },
        { status: 500 }
      )
    }

    const totalSemUsuario = data?.filter((item) => !item.user_id).length ?? 0

    return NextResponse.json({
      success: true,
      message: "Banco de horas sincronizado com sucesso.",
      totalRecebido: rows.length,
      totalImportado: data?.length ?? 0,
      totalSemUsuario,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro inesperado na sincronização.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}