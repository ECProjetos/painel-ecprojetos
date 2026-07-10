"use server"

import { createClient } from "@/utils/supabase/server"
import { supabaseAdmin } from "@/utils/supabase/admin"
import { revalidatePath } from "next/cache"

export type FeriasStatus = "pendente" | "aprovada" | "reprovada" | "cancelada"
export type FeriasTipo =
  | "ferias"
  | "ausencia"
  | "atestado"
  | "day_off"
  | "licenca"

export type FeriasSolicitacaoInput = {
  colaboradorId: string
  dataInicio: string
  dataFim: string
  tipo: FeriasTipo
  observacao?: string
  periodoAquisitivoInicio?: string
  periodoAquisitivoFim?: string
  diasVendidos?: number
  adiantamento13?: boolean
}

export type MinhaFeriasSolicitacaoInput = Omit<
  FeriasSolicitacaoInput,
  "colaboradorId" | "tipo"
>

export type FeriasFiltros = {
  ano?: number
  mes?: number
  status?: FeriasStatus | "todos"
  colaborador?: string
  equipe?: string
}

 const EQUIPE_ENGENHARIA_SUSTENTABILIDADE =
  "Engenharia/Sustentabilidade"

const EQUIPES_ENGENHARIA_SUSTENTABILIDADE = [
  "Departamento de Engenharia",
  "Departamento de Meio Ambiente e Geoprocessamento",
]

async function getUsuarioLogado() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const { data: perfilPorId } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (perfilPorId?.id) {
    return {
      authUser: user,
      publicUserId: perfilPorId.id,
    }
  }

  if (user.email) {
    const { data: perfilPorEmail, error: perfilError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", user.email)
      .maybeSingle()

    if (perfilError) {
      console.error("Erro ao buscar usuário público por e-mail:", perfilError)
    }

    if (perfilPorEmail?.id) {
      return {
        authUser: user,
        publicUserId: perfilPorEmail.id,
      }
    }
  }

  throw new Error("Usuário autenticado não encontrado na tabela de usuários.")
}

export async function isRhFeriasAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  const idsParaVerificar = [user.id]

  if (user.email) {
    const { data: perfil } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", user.email)
      .maybeSingle()

    if (perfil?.id && !idsParaVerificar.includes(perfil.id)) {
      idsParaVerificar.push(perfil.id)
    }
  }

  const { data, error } = await supabaseAdmin
    .from("rh_ferias_permissoes")
    .select("id")
    .in("user_id", idsParaVerificar)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Erro ao validar permissão de férias:", error)
    return false
  }

  return Boolean(data)
}

async function ensureRhFeriasPermission() {
  const user = await getUsuarioLogado()
  const permitido = await isRhFeriasAdmin()

  if (!permitido) {
    throw new Error("Você não tem permissão para acessar a Gestão de Férias.")
  }

  return user
}

function normalizarEquipe(equipe: string | null) {
  if (!equipe) {
    return null
  }

  if (
    EQUIPES_ENGENHARIA_SUSTENTABILIDADE.includes(equipe) ||
    equipe === EQUIPE_ENGENHARIA_SUSTENTABILIDADE
  ) {
    return EQUIPE_ENGENHARIA_SUSTENTABILIDADE
  }

  return equipe
}

function normalizarSolicitacoes(solicitacoes: any[]) {
  return solicitacoes.map((item) => ({
    ...item,
    equipe: normalizarEquipe(item.equipe ?? null),
  }))
}

async function buscarPerfilCompleto(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      `
      id,
      nome,
      email,
      status,
      cargo:cargos(nome),
      user_departments(
        departments(name)
      )
    `,
    )
    .eq("id", userId)
    .single()

  if (error || !data) {
    console.error("Erro ao buscar perfil do colaborador:", error)
    throw new Error("Não foi possível localizar o perfil do colaborador.")
  }

  return data as any
}

export async function getColaboradoresFerias() {
  await ensureRhFeriasPermission()

  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      `
      id,
      nome,
      email,
      status,
      cargo:cargos(nome),
      user_departments(
        departments(name)
      )
    `,
    )
    .eq("status", "ativo")
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar colaboradores:", error)
    throw new Error("Erro ao buscar colaboradores.")
  }

  return (data ?? []).map((user: any) => {
    const departamento = user.user_departments?.[0]?.departments?.name ?? null

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      cargo: user.cargo?.nome ?? null,
      equipe: normalizarEquipe(departamento),
    }
  })
}

export async function getFeriasSolicitacoes(filtros?: FeriasFiltros) {
  await ensureRhFeriasPermission()

  let query = supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .order("data_inicio", { ascending: true })

  if (filtros?.ano && filtros?.mes) {
    const inicioMes = `${filtros.ano}-${String(filtros.mes).padStart(2, "0")}-01`
    const fimMes = new Date(filtros.ano, filtros.mes, 0)
      .toISOString()
      .slice(0, 10)

    query = query.lte("data_inicio", fimMes).gte("data_fim", inicioMes)
  }

  if (filtros?.status && filtros.status !== "todos") {
    query = query.eq("status", filtros.status)
  }

  if (filtros?.colaborador) {
    query = query.ilike("colaborador_nome", `%${filtros.colaborador}%`)
  }

  if (filtros?.equipe) {
    if (filtros.equipe === EQUIPE_ENGENHARIA_SUSTENTABILIDADE) {
      query = query.in("equipe", [
        ...EQUIPES_ENGENHARIA_SUSTENTABILIDADE,
        EQUIPE_ENGENHARIA_SUSTENTABILIDADE,
      ])
    } else {
      query = query.eq("equipe", filtros.equipe)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar férias:", error)
    throw new Error("Erro ao buscar solicitações de férias.")
  }

  return normalizarSolicitacoes(data ?? [])
}

export async function getFeriasPendentes() {
  await ensureRhFeriasPermission()

  const { data, error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .eq("status", "pendente")
    .order("data_inicio", { ascending: true })

  if (error) {
    console.error("Erro ao buscar solicitações pendentes:", error)
    throw new Error("Erro ao buscar solicitações pendentes.")
  }

  return normalizarSolicitacoes(data ?? [])
}

export async function getFeriasResumo(filtros?: FeriasFiltros) {
  const solicitacoes = await getFeriasSolicitacoes(filtros)
  const hoje = new Date().toISOString().slice(0, 10)

  const total = solicitacoes.length
  const pendentes = solicitacoes.filter(
    (item) => item.status === "pendente",
  ).length
  const aprovadas = solicitacoes.filter(
    (item) => item.status === "aprovada",
  ).length
  const reprovadas = solicitacoes.filter(
    (item) => item.status === "reprovada",
  ).length
  const canceladas = solicitacoes.filter(
    (item) => item.status === "cancelada",
  ).length

  const emFeriasHoje = solicitacoes.filter(
    (item) =>
      item.status === "aprovada" &&
      item.data_inicio <= hoje &&
      item.data_fim >= hoje,
  ).length

  const conflitos = calcularConflitos(solicitacoes)

  return {
    total,
    pendentes,
    aprovadas,
    reprovadas,
    canceladas,
    emFeriasHoje,
    conflitos: conflitos.length,
  }
}

export async function getFeriasDashboard(filtros?: FeriasFiltros) {
  await ensureRhFeriasPermission()

  const [colaboradores, solicitacoes, pendencias] = await Promise.all([
    getColaboradoresFerias(),
    getFeriasSolicitacoes(filtros),
    getFeriasPendentes(),
  ])

  const hoje = new Date().toISOString().slice(0, 10)
  const conflitos = calcularConflitos(solicitacoes)

  const resumo = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((item) => item.status === "pendente").length,
    aprovadas: solicitacoes.filter((item) => item.status === "aprovada").length,
    reprovadas: solicitacoes.filter((item) => item.status === "reprovada")
      .length,
    canceladas: solicitacoes.filter((item) => item.status === "cancelada")
      .length,
    emFeriasHoje: solicitacoes.filter(
      (item) =>
        item.status === "aprovada" &&
        item.data_inicio <= hoje &&
        item.data_fim >= hoje,
    ).length,
    conflitos: conflitos.length,
  }

  return {
    colaboradores,
    solicitacoes,
    pendencias,
    resumo,
    conflitos,
  }
}

export async function criarFeriasSolicitacao(input: FeriasSolicitacaoInput) {
  const usuario = await ensureRhFeriasPermission()

  validarDatasSolicitacao(input.dataInicio, input.dataFim)

  if (!input.colaboradorId) {
    throw new Error("Selecione um colaborador.")
  }

  const colaborador = await buscarPerfilCompleto(input.colaboradorId)

  if (colaborador.status !== "ativo") {
    throw new Error("Não é possível lançar férias para colaborador inativo.")
  }

  const equipe =
    colaborador.user_departments?.[0]?.departments?.name ?? null
  const cargo = colaborador.cargo?.nome ?? null

  await inserirSolicitacao({
    colaboradorId: colaborador.id,
    colaboradorNome: colaborador.nome,
    equipe,
    cargo,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipo: input.tipo,
    observacao: input.observacao,
    periodoAquisitivoInicio: input.periodoAquisitivoInicio,
    periodoAquisitivoFim: input.periodoAquisitivoFim,
    diasVendidos: input.diasVendidos,
    adiantamento13: input.adiantamento13,
    criadoPor: usuario.publicUserId,
  })

  revalidatePath("/rh/ferias")
  revalidatePath("/rh/minhas-ferias")

  return { success: true }
}

export async function getMinhasFeriasDashboard() {
  const usuario = await getUsuarioLogado()
  const perfil = await buscarPerfilCompleto(usuario.publicUserId)

  const { data, error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .eq("colaborador_id", usuario.publicUserId)
    .order("data_inicio", { ascending: false })

  if (error) {
    console.error("Erro ao buscar solicitações do colaborador:", error)
    throw new Error("Erro ao buscar suas solicitações de férias.")
  }

  const solicitacoes = normalizarSolicitacoes(data ?? [])

  return {
    colaborador: {
      id: perfil.id,
      nome: perfil.nome,
      email: perfil.email,
      status: perfil.status,
      cargo: perfil.cargo?.nome ?? null,
      equipe: normalizarEquipe(
        perfil.user_departments?.[0]?.departments?.name ?? null,
      ),
    },
    solicitacoes,
    resumo: {
      total: solicitacoes.length,
      pendentes: solicitacoes.filter((item) => item.status === "pendente")
        .length,
      aprovadas: solicitacoes.filter((item) => item.status === "aprovada")
        .length,
      reprovadas: solicitacoes.filter((item) => item.status === "reprovada")
        .length,
      canceladas: solicitacoes.filter((item) => item.status === "cancelada")
        .length,
    },
  }
}

export async function criarMinhaSolicitacaoFerias(
  input: MinhaFeriasSolicitacaoInput,
) {
  const usuario = await getUsuarioLogado()
  const colaborador = await buscarPerfilCompleto(usuario.publicUserId)

  validarDatasSolicitacao(input.dataInicio, input.dataFim)

  if (colaborador.status !== "ativo") {
    throw new Error("Seu usuário está inativo e não pode criar solicitações.")
  }

  const equipe =
    colaborador.user_departments?.[0]?.departments?.name ?? null
  const cargo = colaborador.cargo?.nome ?? null

  await inserirSolicitacao({
    colaboradorId: colaborador.id,
    colaboradorNome: colaborador.nome,
    equipe,
    cargo,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipo: "ferias",
    observacao: input.observacao,
    periodoAquisitivoInicio: input.periodoAquisitivoInicio,
    periodoAquisitivoFim: input.periodoAquisitivoFim,
    diasVendidos: input.diasVendidos,
    adiantamento13: input.adiantamento13,
    criadoPor: usuario.publicUserId,
  })

  revalidatePath("/rh/minhas-ferias")
  revalidatePath("/rh/ferias")

  return { success: true }
}

export async function cancelarMinhaSolicitacaoFerias(
  solicitacaoId: string,
  observacao?: string,
) {
  const usuario = await getUsuarioLogado()

  const { data: atual, error: atualError } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("id, colaborador_id, status")
    .eq("id", solicitacaoId)
    .eq("colaborador_id", usuario.publicUserId)
    .single()

  if (atualError || !atual) {
    throw new Error("Solicitação não encontrada.")
  }

  if (atual.status !== "pendente") {
    throw new Error("Somente solicitações pendentes podem ser canceladas.")
  }

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .update({
      status: "cancelada",
      motivo_reprovacao: observacao || "Cancelada pelo colaborador.",
    })
    .eq("id", solicitacaoId)
    .eq("colaborador_id", usuario.publicUserId)

  if (error) {
    console.error("Erro ao cancelar solicitação do colaborador:", error)
    throw new Error("Erro ao cancelar sua solicitação.")
  }

  await supabaseAdmin.from("ferias_historico").insert({
    solicitacao_id: solicitacaoId,
    acao: "cancelada",
    status_anterior: atual.status,
    status_novo: "cancelada",
    observacao: observacao || "Cancelada pelo colaborador.",
    usuario_id: usuario.publicUserId,
  })

  revalidatePath("/rh/minhas-ferias")
  revalidatePath("/rh/ferias")

  return { success: true }
}

export async function atualizarStatusFerias(
  solicitacaoId: string,
  status: FeriasStatus,
  observacao?: string,
) {
  const usuario = await ensureRhFeriasPermission()

  const { data: atual, error: atualError } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("id, status")
    .eq("id", solicitacaoId)
    .single()

  if (atualError || !atual) {
    throw new Error("Solicitação não encontrada.")
  }

  const payload: Record<string, unknown> = {
    status,
  }

  if (status === "aprovada") {
    payload.aprovado_por = usuario.publicUserId
    payload.aprovado_em = new Date().toISOString()
    payload.motivo_reprovacao = null
  }

  if (status === "reprovada" || status === "cancelada") {
    payload.motivo_reprovacao = observacao || null
  }

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .update(payload)
    .eq("id", solicitacaoId)

  if (error) {
    console.error("Erro ao atualizar status das férias:", error)
    throw new Error("Erro ao atualizar status das férias.")
  }

  await supabaseAdmin.from("ferias_historico").insert({
    solicitacao_id: solicitacaoId,
    acao: status,
    status_anterior: atual.status,
    status_novo: status,
    observacao: observacao || null,
    usuario_id: usuario.publicUserId,
  })

  revalidatePath("/rh/ferias")
  revalidatePath("/rh/minhas-ferias")

  return { success: true }
}

export async function excluirFeriasSolicitacao(solicitacaoId: string) {
  await ensureRhFeriasPermission()

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .delete()
    .eq("id", solicitacaoId)

  if (error) {
    console.error("Erro ao excluir solicitação:", error)
    throw new Error("Erro ao excluir solicitação.")
  }

  revalidatePath("/rh/ferias")
  revalidatePath("/rh/minhas-ferias")

  return { success: true }
}

type InserirSolicitacaoInput = {
  colaboradorId: string
  colaboradorNome: string
  equipe: string | null
  cargo: string | null
  dataInicio: string
  dataFim: string
  tipo: FeriasTipo
  observacao?: string
  periodoAquisitivoInicio?: string
  periodoAquisitivoFim?: string
  diasVendidos?: number
  adiantamento13?: boolean
  criadoPor: string
}

async function inserirSolicitacao(input: InserirSolicitacaoInput) {
  const diasCorridos = calcularDiasCorridos(input.dataInicio, input.dataFim)

  const { data: solicitacao, error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .insert({
      colaborador_id: input.colaboradorId,
      colaborador_nome: input.colaboradorNome,
      equipe: input.equipe,
      cargo: input.cargo,
      data_inicio: input.dataInicio,
      data_fim: input.dataFim,
      dias_corridos: diasCorridos,
      tipo: input.tipo,
      status: "pendente",
      periodo_aquisitivo_inicio: input.periodoAquisitivoInicio || null,
      periodo_aquisitivo_fim: input.periodoAquisitivoFim || null,
      dias_vendidos: input.diasVendidos ?? 0,
      adiantamento_13: input.adiantamento13 ?? false,
      observacao: input.observacao || null,
      criado_por: input.criadoPor,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar solicitação de férias:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw new Error(
      `Erro ao criar solicitação de férias: ${error.message}${
        error.details ? ` - ${error.details}` : ""
      }`,
    )
  }

  const { error: historicoError } = await supabaseAdmin
    .from("ferias_historico")
    .insert({
      solicitacao_id: solicitacao.id,
      acao: "criada",
      status_anterior: null,
      status_novo: "pendente",
      observacao: input.observacao || null,
      usuario_id: input.criadoPor,
    })

  if (historicoError) {
    console.error("Erro ao criar histórico de férias:", {
      message: historicoError.message,
      details: historicoError.details,
      hint: historicoError.hint,
      code: historicoError.code,
    })

    throw new Error(
      `Solicitação criada, mas houve erro ao salvar histórico: ${historicoError.message}`,
    )
  }
}

function validarDatasSolicitacao(dataInicio: string, dataFim: string) {
  if (!dataInicio || !dataFim) {
    throw new Error("Informe a data de início e a data de fim.")
  }

  if (dataFim < dataInicio) {
    throw new Error("A data final não pode ser anterior à data inicial.")
  }
}

function calcularConflitos(solicitacoes: any[]) {
  const consideradas = solicitacoes.filter((item) =>
    ["pendente", "aprovada"].includes(item.status),
  )

  const conflitos: any[] = []

  for (let i = 0; i < consideradas.length; i++) {
    for (let j = i + 1; j < consideradas.length; j++) {
      const a = consideradas[i]
      const b = consideradas[j]
      const equipeA = normalizarEquipe(a.equipe ?? null)
      const equipeB = normalizarEquipe(b.equipe ?? null)

      if (!equipeA || !equipeB || equipeA !== equipeB) {
        continue
      }

      const sobrepoe =
        a.data_inicio <= b.data_fim && a.data_fim >= b.data_inicio

      if (sobrepoe) {
        conflitos.push({
          equipe: equipeA,
          colaboradorA: a.colaborador_nome,
          colaboradorB: b.colaborador_nome,
          inicioA: a.data_inicio,
          fimA: a.data_fim,
          inicioB: b.data_inicio,
          fimB: b.data_fim,
        })
      }
    }
  }

  return conflitos
}

function calcularDiasCorridos(dataInicio: string, dataFim: string) {
  const inicio = criarDataLocal(dataInicio)
  const fim = criarDataLocal(dataFim)
  const diferencaMs = fim.getTime() - inicio.getTime()

  return Math.floor(diferencaMs / (1000 * 60 * 60 * 24)) + 1
}

function criarDataLocal(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}
