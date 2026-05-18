"use server"

import { createClient } from "@/utils/supabase/server"

export type PlanoCarreiraVisualizarCycle = {
  id: string
  nome: string
  ano: number
  semestre: number
  status: string
}

export type PlanoCarreiraVisualizarColaborador = {
  id: string
  nome: string
  email: string | null
  cargo_nome: string | null
  departamento_nome: string | null
}

export type PlanoCarreiraVisualizarSummary = {
  id: string
  cycle_id: string
  ciclo_nome: string
  ano: number
  semestre: number
  colaborador_id: string
  colaborador_nome: string
  gestor_id: string | null
  gestor_nome: string | null
  departamento_nome: string
  status: string
  media_geral: number | null
  media_colaborador: number | null
  media_gestor: number | null
  media_notas_geral: number | null
  total_itens_avaliados: number
  data_finalizacao: string | null
}

export type PlanoCarreiraVisualizarAnswer = {
  id: string
  evaluation_id: string
  skill_item_id: string
  skill_nome: string
  skill_descricao: string | null
  skill_ordem: number
  grupo_id: string
  grupo_nome: string
  grupo_tipo: string
  grupo_ordem: number
  nota_colaborador: number | null
  nota_gestor: number | null
  nota_media: number | null
  meta_nota: number | null
  prazo_meta: string | null
  comentario_colaborador: string | null
  comentario_gestor: string | null
  prioridade: string | null
  gap_colaborador_gestor: number | null
  gap_meta_atual: number | null
  ranking_area: number | null
  area_conhecimento: string | null
}

export type PlanoCarreiraVisualizarDetalhe = {
  summary: PlanoCarreiraVisualizarSummary
  answers: PlanoCarreiraVisualizarAnswer[]
  observacoes_colaborador: string | null
  observacoes_gestor: string | null
  plano_acao: string | null
}

export type PlanoCarreiraVisualizarBaseData = {
  currentUserRole: string | null
  canManage: boolean
  cycles: PlanoCarreiraVisualizarCycle[]
  colaboradores: PlanoCarreiraVisualizarColaborador[]
  summaries: PlanoCarreiraVisualizarSummary[]
}

function isManagerRole(role?: string | null) {
  const normalizedRole = String(role ?? "").toUpperCase()

  return (
    normalizedRole === "DIRETOR" ||
    normalizedRole === "GESTOR" ||
    normalizedRole === "ADMIN"
  )
}

function isColaboradorAvaliavel(role?: string | null) {
  const normalizedRole = String(role ?? "").toUpperCase()

  return (
    normalizedRole !== "DIRETOR" &&
    normalizedRole !== "GESTOR" &&
    normalizedRole !== "ADMIN"
  )
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  const normalized =
    typeof value === "string" ? value.replace(",", ".").trim() : value

  const numberValue = Number(normalized)

  return Number.isFinite(numberValue) ? numberValue : null
}

function toTextOrNull(value: unknown) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text || null
}

function getGapColaboradorGestor(
  notaColaborador: number | null,
  notaGestor: number | null,
) {
  if (notaColaborador === null || notaGestor === null) return null

  return Number((notaColaborador - notaGestor).toFixed(2))
}

function getGapMetaAtual(notaMedia: number | null, metaNota: number | null) {
  if (notaMedia === null || metaNota === null) return null

  return Number((metaNota - notaMedia).toFixed(2))
}

async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Usuário não autenticado.")
  }

  return user
}

async function getCurrentUserRole(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar role do usuário:", error)
    return null
  }

  return data?.role ? String(data.role).toUpperCase() : null
}

async function assertCanViewPlanoCarreira() {
  const user = await getCurrentUser()
  const role = await getCurrentUserRole(user.id)

  if (!isManagerRole(role)) {
    throw new Error("Acesso permitido somente para diretores e gestores.")
  }

  return {
    user,
    role,
  }
}

function mapSummary(item: any): PlanoCarreiraVisualizarSummary {
  return {
    id: String(item.id),
    cycle_id: String(item.cycle_id),
    ciclo_nome: String(item.ciclo_nome ?? "-"),
    ano: Number(item.ano ?? 0),
    semestre: Number(item.semestre ?? 0),
    colaborador_id: String(item.colaborador_id),
    colaborador_nome: String(item.colaborador_nome ?? "Colaborador"),
    gestor_id: item.gestor_id ? String(item.gestor_id) : null,
    gestor_nome: item.gestor_nome ? String(item.gestor_nome) : null,
    departamento_nome: String(item.departamento_nome ?? "-"),
    status: String(item.status ?? "rascunho"),
    media_geral: toNumberOrNull(item.media_geral),
    media_colaborador: toNumberOrNull(item.media_colaborador),
    media_gestor: toNumberOrNull(item.media_gestor),
    media_notas_geral: toNumberOrNull(item.media_notas_geral),
    total_itens_avaliados: Number(item.total_itens_avaliados ?? 0),
    data_finalizacao: item.data_finalizacao
      ? String(item.data_finalizacao)
      : null,
  }
}

export async function getPlanoCarreiraVisualizarBaseData(): Promise<{
  success: boolean
  message?: string
  data: PlanoCarreiraVisualizarBaseData | null
}> {
  try {
    const { role } = await assertCanViewPlanoCarreira()
    const supabase = await createClient()

    const { data: cyclesData, error: cyclesError } = await supabase
      .from("career_cycles")
      .select("id, nome, ano, semestre, status")
      .order("ano", { ascending: false })
      .order("semestre", { ascending: false })

    if (cyclesError) {
      console.error("Erro ao buscar ciclos:", cyclesError)

      return {
        success: false,
        message: "Não foi possível buscar os ciclos.",
        data: null,
      }
    }

    const { data: colaboradoresData, error: colaboradoresError } =
      await supabase
        .from("vw_colaboradores")
        .select("id, nome, email, role, cargo_nome, departamento_nome, status")
        .order("nome", { ascending: true })

    if (colaboradoresError) {
      console.error("Erro ao buscar colaboradores:", colaboradoresError)

      return {
        success: false,
        message: "Não foi possível buscar os colaboradores.",
        data: null,
      }
    }

    const { data: summariesData, error: summariesError } = await supabase
      .from("vw_career_evaluations_summary")
      .select("*")
      .order("ano", { ascending: false })
      .order("semestre", { ascending: false })
      .order("colaborador_nome", { ascending: true })

    if (summariesError) {
      console.error("Erro ao buscar resumo das avaliações:", summariesError)

      return {
        success: false,
        message: "Não foi possível buscar os resumos das avaliações.",
        data: null,
      }
    }

    const cycles = (cyclesData ?? []).map((item) => ({
      id: String(item.id),
      nome: String(item.nome),
      ano: Number(item.ano),
      semestre: Number(item.semestre),
      status: String(item.status),
    }))

    const colaboradores = (colaboradoresData ?? [])
      .filter((item) => {
        const status = String(item.status ?? "").toLowerCase()
        const roleItem = item.role ? String(item.role) : null

        return status === "ativo" && isColaboradorAvaliavel(roleItem)
      })
      .map((item) => ({
        id: String(item.id),
        nome: String(item.nome ?? "Colaborador"),
        email: item.email ? String(item.email) : null,
        cargo_nome: item.cargo_nome ? String(item.cargo_nome) : null,
        departamento_nome: item.departamento_nome
          ? String(item.departamento_nome)
          : null,
      }))

    const summaries = (summariesData ?? []).map(mapSummary)

    return {
      success: true,
      data: {
        currentUserRole: role,
        canManage: isManagerRole(role),
        cycles,
        colaboradores,
        summaries,
      },
    }
  } catch (error) {
    console.error("Erro geral em getPlanoCarreiraVisualizarBaseData:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a visualização do Plano de Carreira.",
      data: null,
    }
  }
}

export async function getPlanoCarreiraVisualizarDetalhe(params: {
  cycleId: string
  colaboradorId: string
}): Promise<{
  success: boolean
  message?: string
  data: PlanoCarreiraVisualizarDetalhe | null
}> {
  try {
    await assertCanViewPlanoCarreira()

    const supabase = await createClient()

    const { data: summaryData, error: summaryError } = await supabase
      .from("vw_career_evaluations_summary")
      .select("*")
      .eq("cycle_id", params.cycleId)
      .eq("colaborador_id", params.colaboradorId)
      .maybeSingle()

    if (summaryError) {
      console.error("Erro ao buscar resumo da avaliação:", summaryError)

      return {
        success: false,
        message: "Não foi possível buscar o resumo da avaliação.",
        data: null,
      }
    }

    if (!summaryData) {
      return {
        success: false,
        message: "Nenhuma avaliação encontrada para este colaborador e ciclo.",
        data: null,
      }
    }

    const summary = mapSummary(summaryData)

    const { data: evaluationData, error: evaluationError } = await supabase
      .from("career_evaluations")
      .select("observacoes_colaborador, observacoes_gestor, plano_acao")
      .eq("id", summary.id)
      .maybeSingle()

    if (evaluationError) {
      console.error("Erro ao buscar observações:", evaluationError)
    }

    const { data: answersData, error: answersError } = await supabase
      .from("career_evaluation_answers")
      .select(
        `
        id,
        evaluation_id,
        skill_item_id,
        nota_colaborador,
        nota_gestor,
        nota_media,
        meta_nota,
        prazo_meta,
        comentario_colaborador,
        comentario_gestor,
        prioridade,
        skill:career_skill_items (
          id,
          nome,
          descricao,
          ordem,
          ranking_area,
          area_conhecimento,
          group:career_skill_groups (
            id,
            nome,
            tipo,
            ordem
          )
        )
      `,
      )
      .eq("evaluation_id", summary.id)

    if (answersError) {
      console.error("Erro ao buscar respostas da avaliação:", answersError)

      return {
        success: false,
        message: "Não foi possível buscar as respostas da avaliação.",
        data: null,
      }
    }

    const answers = (answersData ?? [])
      .map((item: any) => {
        const notaColaborador = toNumberOrNull(item.nota_colaborador)
        const notaGestor = toNumberOrNull(item.nota_gestor)
        const notaMedia = toNumberOrNull(item.nota_media)
        const metaNota = toNumberOrNull(item.meta_nota)

        return {
          id: String(item.id),
          evaluation_id: String(item.evaluation_id),
          skill_item_id: String(item.skill_item_id),
          skill_nome: String(item.skill?.nome ?? "Habilidade"),
          skill_descricao: toTextOrNull(item.skill?.descricao),
          skill_ordem: Number(item.skill?.ordem ?? 0),
          ranking_area: toNumberOrNull(item.skill?.ranking_area),
          area_conhecimento: toTextOrNull(item.skill?.area_conhecimento),
          grupo_id: String(item.skill?.group?.id ?? ""),
          grupo_nome: String(item.skill?.group?.nome ?? "Grupo"),
          grupo_tipo: String(item.skill?.group?.tipo ?? "outro"),
          grupo_ordem: Number(item.skill?.group?.ordem ?? 0),
          nota_colaborador: notaColaborador,
          nota_gestor: notaGestor,
          nota_media: notaMedia,
          meta_nota: metaNota,
          prazo_meta: toTextOrNull(item.prazo_meta),
          comentario_colaborador: toTextOrNull(item.comentario_colaborador),
          comentario_gestor: toTextOrNull(item.comentario_gestor),
          prioridade: toTextOrNull(item.prioridade),
          gap_colaborador_gestor: getGapColaboradorGestor(
            notaColaborador,
            notaGestor,
          ),
          gap_meta_atual: getGapMetaAtual(notaMedia, metaNota),
        } satisfies PlanoCarreiraVisualizarAnswer
      })
      .sort((a, b) => {
        if (a.grupo_ordem !== b.grupo_ordem) {
          return a.grupo_ordem - b.grupo_ordem
        }

        return a.skill_ordem - b.skill_ordem
      })

    return {
      success: true,
      data: {
        summary,
        answers,
        observacoes_colaborador: toTextOrNull(
          evaluationData?.observacoes_colaborador,
        ),
        observacoes_gestor: toTextOrNull(evaluationData?.observacoes_gestor),
        plano_acao: toTextOrNull(evaluationData?.plano_acao),
      },
    }
  } catch (error) {
    console.error("Erro geral em getPlanoCarreiraVisualizarDetalhe:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o detalhe da avaliação.",
      data: null,
    }
  }
}