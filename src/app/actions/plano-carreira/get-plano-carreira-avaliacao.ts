"use server"

import { createClient } from "@/utils/supabase/server"

export type PlanoCarreiraRole = "DIRETOR" | "GESTOR" | "ADMIN" | string

export type PlanoCarreiraCycle = {
  id: string
  nome: string
  ano: number
  semestre: number
  status: string
}

export type PlanoCarreiraColaborador = {
  id: string
  nome: string
  email: string | null
  role: string | null
  cargo_nome: string | null
  departamento_nome: string | null
  departamento_chave: string
}

export type PlanoCarreiraQuestionario = {
  id: string
  nome: string
  departamento_chave: string
  departamento_nome: string
}

export type PlanoCarreiraAnswer = {
  id: string | null
  evaluation_id: string | null
  skill_item_id: string
  nota_colaborador: number | null
  nota_gestor: number | null
  nota_media: number | null
  meta_nota: number | null
  prazo_meta: string | null
  comentario_colaborador: string | null
  comentario_gestor: string | null
  prioridade: string | null
}

export type PlanoCarreiraSkillItem = {
  id: string
  group_id: string
  nome: string
  descricao: string | null
  ordem: number
  escala_min: number
  escala_max: number
  rubrica_nivel_1: string | null
  rubrica_nivel_2: string | null
  rubrica_nivel_3: string | null
  rubrica_nivel_4: string | null
  rubrica_nivel_5: string | null
  answer: PlanoCarreiraAnswer | null
}

export type PlanoCarreiraSkillGroup = {
  id: string
  nome: string
  tipo: string
  descricao: string | null
  ordem: number
  items: PlanoCarreiraSkillItem[]
}

export type PlanoCarreiraEvaluation = {
  id: string
  cycle_id: string
  questionnaire_id: string
  colaborador_id: string
  gestor_id: string | null
  departamento_chave: string
  departamento_nome: string
  status: string
  media_geral: number | null
  media_colaborador: number | null
  media_gestor: number | null
  observacoes_colaborador: string | null
  observacoes_gestor: string | null
  plano_acao: string | null
  data_finalizacao: string | null
}

export type PlanoCarreiraAvaliacaoData = {
  currentUserRole: string | null
  canManage: boolean
  cycles: PlanoCarreiraCycle[]
  colaboradores: PlanoCarreiraColaborador[]
}

export type PlanoCarreiraQuestionarioData = {
  colaborador: PlanoCarreiraColaborador
  questionario: PlanoCarreiraQuestionario
  evaluation: PlanoCarreiraEvaluation | null
  groups: PlanoCarreiraSkillGroup[]
}

export type PlanoCarreiraAnswerInput = {
  skill_item_id: string
  nota_colaborador: number | null
  nota_gestor: number | null
  meta_nota: number | null
  prazo_meta: string | null
  comentario_colaborador: string | null
  comentario_gestor: string | null
  prioridade: string | null
}

export type SalvarPlanoCarreiraPayload = {
  cycleId: string
  colaboradorId: string
  status: "rascunho" | "em_andamento" | "finalizada"
  observacoes_colaborador?: string | null
  observacoes_gestor?: string | null
  plano_acao?: string | null
  answers: PlanoCarreiraAnswerInput[]
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function getDepartamentoChave(nome?: string | null) {
  const normalized = normalizeText(nome ?? "")

  if (
    normalized.includes("meio") ||
    normalized.includes("ambient") ||
    normalized.includes("geoprocess") ||
    normalized.includes("sustent")
  ) {
    return "meio_ambiente"
  }

  if (
    normalized.includes("engenharia") ||
    normalized.includes("projetos") ||
    normalized.includes("infraestrutura")
  ) {
    return "engenharia"
  }

  if (
    normalized.includes("economia") ||
    normalized.includes("economico") ||
    normalized.includes("operacoes") ||
    normalized.includes("operacional")
  ) {
    return "economia"
  }

  if (
    normalized.includes("comercial") ||
    normalized.includes("negocios") ||
    normalized.includes("prospeccao")
  ) {
    return "comercial"
  }

  if (
    normalized.includes("adm") ||
    normalized.includes("administrativo") ||
    normalized.includes("administracao") ||
    normalized.includes("financeiro") ||
    normalized.includes("rh") ||
    normalized.includes("recursos humanos")
  ) {
    return "administrativo"
  }

  return normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
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
  if (value === null || value === undefined || value === "") {
    return null
  }

  const normalized =
    typeof value === "string" ? value.replace(",", ".").trim() : value

  const numberValue = Number(normalized)

  return Number.isFinite(numberValue) ? numberValue : null
}

function toTextOrNull(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function getAverage(values: Array<number | null>) {
  const validValues = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  )

  if (!validValues.length) {
    return null
  }

  const sum = validValues.reduce((acc, value) => acc + value, 0)

  return Number((sum / validValues.length).toFixed(2))
}

function getAnswerMedia(answer: PlanoCarreiraAnswerInput) {
  const notaColaborador = toNumberOrNull(answer.nota_colaborador)
  const notaGestor = toNumberOrNull(answer.nota_gestor)

  if (notaColaborador !== null && notaGestor !== null) {
    return Number(((notaColaborador + notaGestor) / 2).toFixed(2))
  }

  if (notaColaborador !== null) {
    return notaColaborador
  }

  if (notaGestor !== null) {
    return notaGestor
  }

  return null
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

async function assertCanManagePlanoCarreira() {
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

async function getColaboradorById(colaboradorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_colaboradores")
    .select("id, nome, email, role, cargo_nome, departamento_nome, status")
    .eq("id", colaboradorId)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar colaborador:", error)
    throw new Error("Não foi possível buscar o colaborador selecionado.")
  }

  if (!data) {
    throw new Error("Colaborador não encontrado.")
  }

  const role = data.role ? String(data.role) : null

  if (!isColaboradorAvaliavel(role)) {
    throw new Error("Diretores e gestores não devem ser avaliados neste fluxo.")
  }

  const departamentoNome = data.departamento_nome
    ? String(data.departamento_nome)
    : null

  return {
    id: String(data.id),
    nome: String(data.nome ?? "Colaborador"),
    email: data.email ? String(data.email) : null,
    role,
    cargo_nome: data.cargo_nome ? String(data.cargo_nome) : null,
    departamento_nome: departamentoNome,
    departamento_chave: getDepartamentoChave(departamentoNome),
  } satisfies PlanoCarreiraColaborador
}

async function getQuestionarioByDepartamento(departamentoChave: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("career_questionnaires")
    .select(
      "id, nome, departamento_chave, departamento_nome, ativo, created_at",
    )
    .eq("departamento_chave", departamentoChave)
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar questionário:", error)
    throw new Error("Não foi possível buscar o questionário do departamento.")
  }

  if (!data) {
    throw new Error(
      `Não existe questionário ativo para o departamento identificado como: ${departamentoChave}.`,
    )
  }

  return {
    id: String(data.id),
    nome: String(data.nome),
    departamento_chave: String(data.departamento_chave),
    departamento_nome: String(data.departamento_nome),
  } satisfies PlanoCarreiraQuestionario
}

export async function getPlanoCarreiraAvaliacaoData(): Promise<{
  success: boolean
  message?: string
  data: PlanoCarreiraAvaliacaoData | null
}> {
  try {
    const { user, role } = await assertCanManagePlanoCarreira()
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
        message: "Não foi possível buscar os ciclos de avaliação.",
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

    const colaboradores = (colaboradoresData ?? [])
      .filter((item) => {
        const status = String(item.status ?? "").toLowerCase()
        const roleItem = item.role ? String(item.role) : null

        return status === "ativo" && isColaboradorAvaliavel(roleItem)
      })
      .map((item) => {
        const departamentoNome = item.departamento_nome
          ? String(item.departamento_nome)
          : null

        return {
          id: String(item.id),
          nome: String(item.nome ?? "Colaborador"),
          email: item.email ? String(item.email) : null,
          role: item.role ? String(item.role) : null,
          cargo_nome: item.cargo_nome ? String(item.cargo_nome) : null,
          departamento_nome: departamentoNome,
          departamento_chave: getDepartamentoChave(departamentoNome),
        }
      })

    const cycles = (cyclesData ?? []).map((item) => ({
      id: String(item.id),
      nome: String(item.nome),
      ano: Number(item.ano),
      semestre: Number(item.semestre),
      status: String(item.status),
    }))

    return {
      success: true,
      data: {
        currentUserRole: role,
        canManage: isManagerRole(role),
        cycles,
        colaboradores,
      },
    }
  } catch (error) {
    console.error("Erro geral em getPlanoCarreiraAvaliacaoData:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do Plano de Carreira.",
      data: null,
    }
  }
}

export async function getQuestionarioPlanoCarreira(params: {
  cycleId: string
  colaboradorId: string
}): Promise<{
  success: boolean
  message?: string
  data: PlanoCarreiraQuestionarioData | null
}> {
  try {
    await assertCanManagePlanoCarreira()

    const supabase = await createClient()
    const colaborador = await getColaboradorById(params.colaboradorId)
    const questionario = await getQuestionarioByDepartamento(
      colaborador.departamento_chave,
    )

    const { data: evaluationData, error: evaluationError } = await supabase
      .from("career_evaluations")
      .select(
        `
        id,
        cycle_id,
        questionnaire_id,
        colaborador_id,
        gestor_id,
        departamento_chave,
        departamento_nome,
        status,
        media_geral,
        media_colaborador,
        media_gestor,
        observacoes_colaborador,
        observacoes_gestor,
        plano_acao,
        data_finalizacao
      `,
      )
      .eq("cycle_id", params.cycleId)
      .eq("colaborador_id", params.colaboradorId)
      .maybeSingle()

    if (evaluationError) {
      console.error("Erro ao buscar avaliação existente:", evaluationError)

      return {
        success: false,
        message: "Não foi possível buscar a avaliação existente.",
        data: null,
      }
    }

    const { data: groupsData, error: groupsError } = await supabase
      .from("career_skill_groups")
      .select("id, nome, tipo, descricao, ordem")
      .eq("questionnaire_id", questionario.id)
      .eq("ativo", true)
      .in("tipo", ["hard_skill", "soft_skill"])
      .order("ordem", { ascending: true })

    if (groupsError) {
      console.error("Erro ao buscar grupos:", groupsError)

      return {
        success: false,
        message: "Não foi possível buscar os grupos do questionário.",
        data: null,
      }
    }

    const groupIds = (groupsData ?? []).map((item) => String(item.id))

    const { data: itemsData, error: itemsError } = groupIds.length
      ? await supabase
          .from("career_skill_items")
          .select(
            `
            id,
            group_id,
            nome,
            descricao,
            ordem,
            escala_min,
            escala_max,
            rubrica_nivel_1,
            rubrica_nivel_2,
            rubrica_nivel_3,
            rubrica_nivel_4,
            rubrica_nivel_5
          `,
          )
          .in("group_id", groupIds)
          .eq("ativo", true)
          .order("ordem", { ascending: true })
      : { data: [], error: null }

    if (itemsError) {
      console.error("Erro ao buscar itens:", itemsError)

      return {
        success: false,
        message: "Não foi possível buscar os itens do questionário.",
        data: null,
      }
    }

    let answersBySkillItemId = new Map<string, PlanoCarreiraAnswer>()

    if (evaluationData?.id) {
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
          prioridade
        `,
        )
        .eq("evaluation_id", evaluationData.id)

      if (answersError) {
        console.error("Erro ao buscar respostas:", answersError)

        return {
          success: false,
          message: "Não foi possível buscar as respostas existentes.",
          data: null,
        }
      }

      answersBySkillItemId = new Map(
        (answersData ?? []).map((answer) => [
          String(answer.skill_item_id),
          {
            id: String(answer.id),
            evaluation_id: String(answer.evaluation_id),
            skill_item_id: String(answer.skill_item_id),
            nota_colaborador: toNumberOrNull(answer.nota_colaborador),
            nota_gestor: toNumberOrNull(answer.nota_gestor),
            nota_media: toNumberOrNull(answer.nota_media),
            meta_nota: toNumberOrNull(answer.meta_nota),
            prazo_meta: toTextOrNull(answer.prazo_meta),
            comentario_colaborador: toTextOrNull(answer.comentario_colaborador),
            comentario_gestor: toTextOrNull(answer.comentario_gestor),
            prioridade: toTextOrNull(answer.prioridade),
          },
        ]),
      )
    }

    const itemsByGroupId = new Map<string, PlanoCarreiraSkillItem[]>()

    for (const item of itemsData ?? []) {
      const groupId = String(item.group_id)

      const skillItem: PlanoCarreiraSkillItem = {
        id: String(item.id),
        group_id: groupId,
        nome: String(item.nome),
        descricao: item.descricao ? String(item.descricao) : null,
        ordem: Number(item.ordem ?? 0),
        escala_min: Number(item.escala_min ?? 1),
        escala_max: Number(item.escala_max ?? 5),
        rubrica_nivel_1: toTextOrNull(item.rubrica_nivel_1),
        rubrica_nivel_2: toTextOrNull(item.rubrica_nivel_2),
        rubrica_nivel_3: toTextOrNull(item.rubrica_nivel_3),
        rubrica_nivel_4: toTextOrNull(item.rubrica_nivel_4),
        rubrica_nivel_5: toTextOrNull(item.rubrica_nivel_5),
        answer: answersBySkillItemId.get(String(item.id)) ?? null,
      }

      const currentItems = itemsByGroupId.get(groupId) ?? []
      currentItems.push(skillItem)
      itemsByGroupId.set(groupId, currentItems)
    }

    const groups = (groupsData ?? []).map((group) => ({
      id: String(group.id),
      nome: String(group.nome),
      tipo: String(group.tipo),
      descricao: group.descricao ? String(group.descricao) : null,
      ordem: Number(group.ordem ?? 0),
      items: itemsByGroupId.get(String(group.id)) ?? [],
    }))

    const evaluation = evaluationData
      ? {
          id: String(evaluationData.id),
          cycle_id: String(evaluationData.cycle_id),
          questionnaire_id: String(evaluationData.questionnaire_id),
          colaborador_id: String(evaluationData.colaborador_id),
          gestor_id: evaluationData.gestor_id
            ? String(evaluationData.gestor_id)
            : null,
          departamento_chave: String(evaluationData.departamento_chave),
          departamento_nome: String(evaluationData.departamento_nome),
          status: String(evaluationData.status),
          media_geral: toNumberOrNull(evaluationData.media_geral),
          media_colaborador: toNumberOrNull(evaluationData.media_colaborador),
          media_gestor: toNumberOrNull(evaluationData.media_gestor),
          observacoes_colaborador: toTextOrNull(
            evaluationData.observacoes_colaborador,
          ),
          observacoes_gestor: toTextOrNull(evaluationData.observacoes_gestor),
          plano_acao: toTextOrNull(evaluationData.plano_acao),
          data_finalizacao: evaluationData.data_finalizacao
            ? String(evaluationData.data_finalizacao)
            : null,
        }
      : null

    return {
      success: true,
      data: {
        colaborador,
        questionario,
        evaluation,
        groups,
      },
    }
  } catch (error) {
    console.error("Erro geral em getQuestionarioPlanoCarreira:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o questionário.",
      data: null,
    }
  }
}

export async function salvarAvaliacaoPlanoCarreira(
  payload: SalvarPlanoCarreiraPayload,
): Promise<{
  success: boolean
  message?: string
  evaluationId?: string
}> {
  try {
    const { user } = await assertCanManagePlanoCarreira()
    const supabase = await createClient()

    if (!payload.cycleId || !payload.colaboradorId) {
      return {
        success: false,
        message: "Selecione o ciclo e o colaborador antes de salvar.",
      }
    }

    const colaborador = await getColaboradorById(payload.colaboradorId)
    const questionario = await getQuestionarioByDepartamento(
      colaborador.departamento_chave,
    )

    const { data: existingEvaluation, error: existingError } = await supabase
      .from("career_evaluations")
      .select("id")
      .eq("cycle_id", payload.cycleId)
      .eq("colaborador_id", payload.colaboradorId)
      .maybeSingle()

    if (existingError) {
      console.error("Erro ao buscar avaliação existente:", existingError)

      return {
        success: false,
        message: "Não foi possível verificar se já existe avaliação.",
      }
    }

    const status = payload.status
    const dataFinalizacao =
      status === "finalizada" ? new Date().toISOString() : null

    let evaluationId = existingEvaluation?.id
      ? String(existingEvaluation.id)
      : null

    if (evaluationId) {
      const { error: updateError } = await supabase
        .from("career_evaluations")
        .update({
          questionnaire_id: questionario.id,
          gestor_id: user.id,
          departamento_chave: colaborador.departamento_chave,
          departamento_nome:
            colaborador.departamento_nome ?? questionario.departamento_nome,
          status,
          observacoes_colaborador: toTextOrNull(
            payload.observacoes_colaborador,
          ),
          observacoes_gestor: toTextOrNull(payload.observacoes_gestor),
          plano_acao: toTextOrNull(payload.plano_acao),
          data_finalizacao: dataFinalizacao,
        })
        .eq("id", evaluationId)

      if (updateError) {
        console.error("Erro ao atualizar avaliação:", updateError)

        return {
          success: false,
          message: "Não foi possível atualizar a avaliação.",
        }
      }
    } else {
      const { data: insertedEvaluation, error: insertError } = await supabase
        .from("career_evaluations")
        .insert({
          cycle_id: payload.cycleId,
          questionnaire_id: questionario.id,
          colaborador_id: payload.colaboradorId,
          gestor_id: user.id,
          departamento_chave: colaborador.departamento_chave,
          departamento_nome:
            colaborador.departamento_nome ?? questionario.departamento_nome,
          status,
          observacoes_colaborador: toTextOrNull(
            payload.observacoes_colaborador,
          ),
          observacoes_gestor: toTextOrNull(payload.observacoes_gestor),
          plano_acao: toTextOrNull(payload.plano_acao),
          data_finalizacao: dataFinalizacao,
          created_by: user.id,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Erro ao criar avaliação:", insertError)

        return {
          success: false,
          message: "Não foi possível criar a avaliação.",
        }
      }

      evaluationId = String(insertedEvaluation.id)
    }

    const answersToSave = payload.answers
      .filter((answer) => Boolean(answer.skill_item_id))
      .map((answer) => ({
        evaluation_id: evaluationId,
        skill_item_id: answer.skill_item_id,
        nota_colaborador: toNumberOrNull(answer.nota_colaborador),
        nota_gestor: toNumberOrNull(answer.nota_gestor),
        meta_nota: toNumberOrNull(answer.meta_nota),
        prazo_meta: toTextOrNull(answer.prazo_meta),
        comentario_colaborador: toTextOrNull(answer.comentario_colaborador),
        comentario_gestor: toTextOrNull(answer.comentario_gestor),
        prioridade: toTextOrNull(answer.prioridade),
      }))

    if (answersToSave.length) {
      const { error: answersError } = await supabase
        .from("career_evaluation_answers")
        .upsert(answersToSave, {
          onConflict: "evaluation_id,skill_item_id",
        })

      if (answersError) {
        console.error("Erro ao salvar respostas:", answersError)

        return {
          success: false,
          message: "Não foi possível salvar as respostas da avaliação.",
        }
      }
    }

    const mediaColaborador = getAverage(
      payload.answers.map((answer) => toNumberOrNull(answer.nota_colaborador)),
    )

    const mediaGestor = getAverage(
      payload.answers.map((answer) => toNumberOrNull(answer.nota_gestor)),
    )

    const mediaGeral = getAverage(
      payload.answers.map((answer) => getAnswerMedia(answer)),
    )

    const { error: mediaError } = await supabase
      .from("career_evaluations")
      .update({
        media_colaborador: mediaColaborador,
        media_gestor: mediaGestor,
        media_geral: mediaGeral,
      })
      .eq("id", evaluationId)

    if (mediaError) {
      console.error("Erro ao atualizar médias:", mediaError)

      return {
        success: false,
        message:
          "A avaliação foi salva, mas não foi possível atualizar as médias.",
        evaluationId,
      }
    }

    return {
      success: true,
      message:
        status === "finalizada"
          ? "Avaliação finalizada com sucesso."
          : "Avaliação salva com sucesso.",
      evaluationId,
    }
  } catch (error) {
    console.error("Erro geral em salvarAvaliacaoPlanoCarreira:", error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a avaliação.",
    }
  }
}
