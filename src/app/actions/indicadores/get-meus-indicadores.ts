"use server"

import { createClient } from "@/utils/supabase/server"
import {
  getIndicadoresDashboard,
  type IndicadorDashboardItem,
} from "@/app/actions/indicadores-dashboard"

export type MeuPerfilIndicadores = {
  id: string
  nome: string
  email: string | null
  role: string | null
  departamento_nome: string | null
  cargo_nome: string | null
}

export type MinhaEntregaIndicador = {
  id: string
  created_at: string | null
  avaliador_nome: string | null
  colaborador_id: string
  colaborador_nome: string
  equipe_colaborador: string | null
  codigo_projeto: string | null
  entrega_avaliada: string | null
  data_entrega: string | null
  data_revisao: string | null
  ano: number | null
  trimestre: number | null
  ies_aprovado_primeira: boolean
  ip_no_prazo: boolean
  clareza_estrutura: number
  profundidade_rigor: number
  alinhamento_demanda: number
  forma_profissionalismo: number
  iq: number
  pontos_fortes: string | null
  pontos_fracos: string | null
  comentario_geral: string | null
}

export type MeuRelatorioIndicador = {
  id: string
  codigo_relatorio: string
  titulo: string
  projeto: string
  data_referencia: string | null
  ano: number | null
  trimestre: number | null
  status: string
}

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".")
    const numberValue = Number(normalized)

    return Number.isFinite(numberValue) ? numberValue : 0
  }

  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function getAnoFromDate(value?: string | null) {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getFullYear()
}

function getTrimestreFromDate(value?: string | null) {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return null

  const month = parsed.getMonth() + 1

  return Math.ceil(month / 3)
}

function getReferenciaDate(item: {
  data_revisao?: string | null
  data_entrega?: string | null
}) {
  return item.data_revisao ?? item.data_entrega ?? null
}

function getStatusEntrega(item: {
  ies_aprovado_primeira: boolean
  ip_no_prazo: boolean
  iq: number
}) {
  if (item.ies_aprovado_primeira && item.ip_no_prazo && item.iq >= 4) {
    return "OK"
  }

  if (item.iq >= 3) {
    return "Atenção"
  }

  return "Crítico"
}

function sanitizeProjectCode(value?: string | null) {
  const text = String(value ?? "PROJ")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")

  return text || "PROJ"
}

async function getLoggedUserId() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Usuário não autenticado.")
  }

  return user.id
}

async function getMeuPerfil(userId: string): Promise<MeuPerfilIndicadores> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("id, nome, email, role, departamento_nome, cargo_nome")
    .eq("id", userId)
    .maybeSingle()

  if (!error && data) {
    return {
      id: String(data.id),
      nome: String(data.nome ?? "Colaborador"),
      email: data.email ? String(data.email) : null,
      role: data.role ? String(data.role) : null,
      departamento_nome: data.departamento_nome
        ? String(data.departamento_nome)
        : null,
      cargo_nome: data.cargo_nome ? String(data.cargo_nome) : null,
    }
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, nome, email, role")
    .eq("id", userId)
    .maybeSingle()

  if (userError) {
    console.error("Erro ao buscar perfil do colaborador:", userError)
  }

  return {
    id: userId,
    nome: String(userData?.nome ?? "Colaborador"),
    email: userData?.email ? String(userData.email) : null,
    role: userData?.role ? String(userData.role) : null,
    departamento_nome: null,
    cargo_nome: null,
  }
}

async function getMinhasEntregas(
  userId: string,
  perfil: MeuPerfilIndicadores,
): Promise<MinhaEntregaIndicador[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("indicadores_desempenho")
    .select(
      `
      id,
      created_at,
      avaliador_nome,
      colaborador_id,
      equipe_colaborador,
      codigo_projeto,
      entrega_avaliada,
      data_entrega,
      data_revisao,
      ies_aprovado_primeira,
      ip_no_prazo,
      clareza_estrutura,
      profundidade_rigor,
      alinhamento_demanda,
      forma_profissionalismo,
      pontos_fortes,
      pontos_fracos,
      comentario_geral
    `,
    )
    .eq("colaborador_id", userId)
    .order("data_revisao", { ascending: false })
    .order("data_entrega", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar entregas individuais:", error)
    throw new Error("Não foi possível buscar suas entregas avaliadas.")
  }

  return (data ?? []).map((item) => {
    const dataReferencia = getReferenciaDate(item)
    const clareza = parseNumber(item.clareza_estrutura)
    const profundidade = parseNumber(item.profundidade_rigor)
    const alinhamento = parseNumber(item.alinhamento_demanda)
    const forma = parseNumber(item.forma_profissionalismo)
    const iq = (clareza + profundidade + alinhamento + forma) / 4

    return {
      id: String(item.id),
      created_at: item.created_at ? String(item.created_at) : null,
      avaliador_nome: item.avaliador_nome ? String(item.avaliador_nome) : null,
      colaborador_id: String(item.colaborador_id ?? userId),
      colaborador_nome: perfil.nome,
      equipe_colaborador: item.equipe_colaborador
        ? String(item.equipe_colaborador)
        : perfil.departamento_nome,
      codigo_projeto: item.codigo_projeto ? String(item.codigo_projeto) : null,
      entrega_avaliada: item.entrega_avaliada
        ? String(item.entrega_avaliada)
        : null,
      data_entrega: item.data_entrega ? String(item.data_entrega) : null,
      data_revisao: item.data_revisao ? String(item.data_revisao) : null,
      ano: getAnoFromDate(dataReferencia),
      trimestre: getTrimestreFromDate(dataReferencia),
      ies_aprovado_primeira: Boolean(item.ies_aprovado_primeira),
      ip_no_prazo: Boolean(item.ip_no_prazo),
      clareza_estrutura: clareza,
      profundidade_rigor: profundidade,
      alinhamento_demanda: alinhamento,
      forma_profissionalismo: forma,
      iq,
      pontos_fortes: item.pontos_fortes ? String(item.pontos_fortes) : null,
      pontos_fracos: item.pontos_fracos ? String(item.pontos_fracos) : null,
      comentario_geral: item.comentario_geral
        ? String(item.comentario_geral)
        : null,
    }
  })
}

function montarRelatorios(entregas: MinhaEntregaIndicador[]) {
  const contadorPorProjetoAno = new Map<string, number>()

  return entregas
    .slice()
    .sort((a, b) => {
      const dataA = a.data_revisao ?? a.data_entrega ?? a.created_at ?? ""
      const dataB = b.data_revisao ?? b.data_entrega ?? b.created_at ?? ""

      return dataA.localeCompare(dataB)
    })
    .map((item) => {
      const projeto = sanitizeProjectCode(item.codigo_projeto)
      const ano = item.ano ?? new Date().getFullYear()
      const key = `${projeto}-${ano}`
      const sequencia = (contadorPorProjetoAno.get(key) ?? 0) + 1

      contadorPorProjetoAno.set(key, sequencia)

      const sequenciaFormatada = String(sequencia).padStart(3, "0")
      const codigoRelatorio = `EC-REV-${projeto}-${sequenciaFormatada}-${ano}`

      return {
        id: item.id,
        codigo_relatorio: codigoRelatorio,
        titulo: item.entrega_avaliada ?? "Entrega avaliada",
        projeto,
        data_referencia: item.data_revisao ?? item.data_entrega ?? null,
        ano: item.ano,
        trimestre: item.trimestre,
        status: getStatusEntrega(item),
      }
    })
    .sort((a, b) =>
      String(b.data_referencia ?? "").localeCompare(
        String(a.data_referencia ?? ""),
      ),
    )
}

export async function getMeusIndicadores() {
  try {
    const userId = await getLoggedUserId()
    const perfil = await getMeuPerfil(userId)

    const indicadores = await getIndicadoresDashboard({
      colaboradorId: userId,
    })

    const entregas = await getMinhasEntregas(userId, perfil)
    const relatorios = montarRelatorios(entregas)

    return {
      success: true,
      data: {
        perfil,
        indicadores: indicadores as IndicadorDashboardItem[],
        entregas,
        relatorios,
      },
    }
  } catch (error) {
    console.error("Erro geral em getMeusIndicadores:", error)

    return {
      success: false,
      message: "Não foi possível carregar seus indicadores.",
      data: null,
    }
  }
}