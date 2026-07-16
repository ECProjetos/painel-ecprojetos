"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type FeedbackHistoricoFiltros = {
  cicloId?: string
  tipoFormulario?: string
  categoria?: string
  colaborador?: string
  departamento?: string
}

const equipesFeedback = [
  "Departamento Administrativo",
  "Departamento de Economia",
  "Departamento de Engenharia",
  "Departamento de Meio Ambiente e Geoprocessamento",
]

const departamentosPorEquipe: Record<string, string[]> = {
  "Departamento Administrativo": [
    "Departamento Administrativo",
    "Administrativo",
    "Adm/Finan/Mkt",
    "Adm/Fin/RH",
    "Gestão ADM/Financeira/MKT",
  ],
  "Departamento de Economia": [
    "Departamento de Economia",
    "Economia",
    "Operações e Econômico",
  ],
  "Departamento de Engenharia": [
    "Departamento de Engenharia",
    "Engenharia",
    "Engenharia Consultiva e Arquitetura",
    "Engenharia Construtiva e Arquitetura",
    "Engenharia e Sustentabilidade",
  ],
  "Departamento de Meio Ambiente e Geoprocessamento": [
    "Departamento de Meio Ambiente e Geoprocessamento",
    "Meio Ambiente",
    "Meio Ambiente e Geoprocessamento",
  ],
}

export async function getFeedbackEquipes() {
  return equipesFeedback
}
export async function getFeedbackCiclos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("feedback_ciclos")
    .select(
      "id, nome, ano, mes, periodo, status, created_at, status_respostas, data_inicio_respostas, data_fim_respostas",
    )
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })

  if (error) {
    console.error("Erro ao buscar ciclos de feedback:", error)
    throw new Error("Não foi possível buscar os ciclos de feedback.")
  }

  return data ?? []
}

export async function getFeedbackHistorico(filtros?: FeedbackHistoricoFiltros) {
  const supabase = await createClient()

  let query = supabase
    .from("vw_feedback_historico")
    .select("*")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("data_conclusao", { ascending: false })

  if (filtros?.cicloId) {
    query = query.eq("ciclo_id", filtros.cicloId)
  }

  if (filtros?.tipoFormulario) {
    query = query.eq("tipo_formulario", filtros.tipoFormulario)
  }

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria)
  }

  if (filtros?.departamento) {
    query = query.ilike("departamento", `%${filtros.departamento}%`)
  }

  if (filtros?.colaborador) {
    query = query.or(
      `respondente_nome.ilike.%${filtros.colaborador}%,avaliado_nome.ilike.%${filtros.colaborador}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar histórico de feedbacks:", error)
    throw new Error("Não foi possível buscar o histórico de feedbacks.")
  }

  return data ?? []
}

export type FeedbackAnexosFiltros = {
  cicloId?: string
  categoria?: string
}

export async function getFeedbackRespostaDetalhe(respostaId: string) {
  const supabase = await createClient()

  const { data: resposta, error: respostaError } = await supabase
    .from("feedback_respostas")
    .select(
      `
      *,
      feedback_formularios (
        id,
        tipo,
        titulo,
        categoria,
        confidencialidade,
        feedback_ciclos (
          id,
          nome,
          ano,
          mes,
          periodo
        )
      )
    `,
    )
    .eq("id", respostaId)
    .single()

  if (respostaError) {
    console.error("Erro ao buscar resposta de feedback:", respostaError)
    throw new Error("Não foi possível buscar a resposta do feedback.")
  }

  const { data: itens, error: itensError } = await supabase
    .from("feedback_resposta_itens")
    .select("*")
    .eq("resposta_id", respostaId)
    .order("ordem", { ascending: true })

  if (itensError) {
    console.error("Erro ao buscar itens da resposta:", itensError)
    throw new Error("Não foi possível buscar os itens da resposta.")
  }

  const { data: anexos, error: anexosError } = await supabase
    .from("feedback_anexos")
    .select("*")
    .eq("resposta_id", respostaId)

  if (anexosError) {
    console.error("Erro ao buscar anexos:", anexosError)
    throw new Error("Não foi possível buscar os anexos do feedback.")
  }

  return {
    resposta,
    itens: itens ?? [],
    anexos: anexos ?? [],
  }
}

export type FeedbackConsolidadoFiltros = {
  cicloId?: string
  categoria?: string
  departamento?: string
}

export async function getFeedbackConsolidado(
  filtros?: FeedbackConsolidadoFiltros,
) {
  const supabase = await createClient()

  let query = supabase
    .from("vw_feedback_consolidado")
    .select("*")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("categoria", { ascending: true })
    .order("departamento", { ascending: true })

  if (filtros?.cicloId) {
    query = query.eq("ciclo_id", filtros.cicloId)
  }

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria)
  }

  if (filtros?.departamento) {
    query = query.ilike("departamento", `%${filtros.departamento}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar consolidado de feedbacks:", error)
    throw new Error("Não foi possível buscar o consolidado de feedbacks.")
  }

  return data ?? []
}

export type FeedbackConsolidadoDetalheFiltros = {
  cicloId: string
  categoria: string
  departamento?: string
}

export async function getFeedbackConsolidadoDetalhe(
  filtros: FeedbackConsolidadoDetalheFiltros,
) {
  const supabase = await createClient()

  let queryResumo = supabase
    .from("vw_feedback_consolidado")
    .select("*")
    .eq("ciclo_id", filtros.cicloId)
    .eq("categoria", filtros.categoria)

  let queryPerguntas = supabase
    .from("vw_feedback_consolidado_perguntas")
    .select("*")
    .eq("ciclo_id", filtros.cicloId)
    .eq("categoria", filtros.categoria)
    .order("ordem", { ascending: true })

  let queryComentarios = supabase
    .from("feedback_resposta_itens")
    .select(
      `
        id,
        ordem,
        pergunta,
        resposta_texto,
        resposta_numero,
        feedback_respostas!inner (
          id,
          departamento,
          feedback_formularios!inner (
            id,
            categoria,
            confidencialidade,
            ciclo_id
          )
        )
      `,
    )
    .eq("feedback_respostas.feedback_formularios.ciclo_id", filtros.cicloId)
    .eq("feedback_respostas.feedback_formularios.categoria", filtros.categoria)
    .eq("feedback_respostas.feedback_formularios.confidencialidade", "anonimo")
    .is("resposta_numero", null)
    .not("resposta_texto", "is", null)
    .order("ordem", { ascending: true })

  if (filtros.departamento) {
    queryResumo = queryResumo.eq("departamento", filtros.departamento)
    queryPerguntas = queryPerguntas.eq("departamento", filtros.departamento)
    queryComentarios = queryComentarios.eq(
      "feedback_respostas.departamento",
      filtros.departamento,
    )
  }

  const [
    { data: resumo, error: resumoError },
    { data: perguntas, error: perguntasError },
    { data: comentarios, error: comentariosError },
  ] = await Promise.all([queryResumo, queryPerguntas, queryComentarios])

  if (resumoError) {
    console.error("Erro ao buscar resumo consolidado:", resumoError)
    throw new Error("Não foi possível buscar o resumo consolidado.")
  }

  if (perguntasError) {
    console.error("Erro ao buscar perguntas consolidadas:", perguntasError)
    throw new Error("Não foi possível buscar as perguntas consolidadas.")
  }

  if (comentariosError) {
    console.error("Erro ao buscar comentários consolidados:", comentariosError)
    throw new Error("Não foi possível buscar os comentários consolidados.")
  }

  return {
    resumo: resumo ?? [],
    perguntas: perguntas ?? [],
    comentarios: comentarios ?? [],
  }
}

export async function getFeedbackAnexosHistoricos(
  filtros?: FeedbackAnexosFiltros,
) {
  const supabase = await createClient()

  let query = supabase
    .from("feedback_anexos")
    .select(
      `
      id,
      ciclo_id,
      formulario_id,
      tipo,
      nome_arquivo,
      storage_path,
      origem_arquivo,
      created_at,
      feedback_ciclos (
      id,
      nome,
      ano,
      mes,
      periodo
    ),
    feedback_formularios (
      id,
      tipo,
      titulo,
      categoria,
      confidencialidade
    )
    `,
    )
    .eq("tipo", "pdf_historico")
    .order("created_at", { ascending: false })

  if (filtros?.cicloId) {
    query = query.eq("ciclo_id", filtros.cicloId)
  }

  if (filtros?.categoria) {
    query = query.eq("feedback_formularios.categoria", filtros.categoria)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar anexos históricos:", error)
    throw new Error("Não foi possível buscar os anexos históricos.")
  }

  const anexosComUrl = await Promise.all(
    (data ?? []).map(async (anexo) => {
      if (!anexo.storage_path) {
        return {
          ...anexo,
          signed_url: null,
        }
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("feedbacks-internos")
        .createSignedUrl(anexo.storage_path, 60 * 10)

      if (signedError) {
        console.error("Erro ao gerar URL assinada:", signedError)

        return {
          ...anexo,
          signed_url: null,
        }
      }

      return {
        ...anexo,
        signed_url: signedData.signedUrl,
      }
    }),
  )

  return anexosComUrl
}
export async function getFeedbackFormulariosAbertos() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (perfilError || !perfil) {
    console.error("Erro ao buscar perfil do usuário:", perfilError)
    throw new Error("Não foi possível verificar o perfil do usuário.")
  }

  const role = String(perfil.role ?? "").toUpperCase()
  const podeResponderComoGestor = ["GESTOR", "DIRETOR"].includes(role)
  const publicosPermitidos = podeResponderComoGestor
    ? ["colaborador", "gestor"]
    : ["colaborador"]

  const { data: formularios, error } = await supabase
    .from("feedback_formularios")
    .select(
      `
      id,
      titulo,
      categoria,
      confidencialidade,
      instrucoes,
      ordem,
      status,
      publico_alvo,
      feedback_ciclos!inner (
        id,
        nome,
        ano,
        mes,
        periodo,
        status,
        status_respostas,
        data_inicio_respostas,
        data_fim_respostas
      ),
      feedback_perguntas (
        id
      )
    `,
    )
    .eq("status", "aberto")
    .in("publico_alvo", publicosPermitidos)
    .eq("feedback_ciclos.status", "aberto")
    .eq("feedback_ciclos.status_respostas", "aberto")
    .order("ordem", { ascending: true })

  if (error) {
    console.error("Erro ao buscar formulários abertos:", error)
    throw new Error("Não foi possível buscar os formulários abertos.")
  }

  const agora = new Date()

  const formulariosDisponiveis = (formularios ?? []).filter((formulario) => {
    const cicloRaw = formulario.feedback_ciclos
    const ciclo = Array.isArray(cicloRaw) ? cicloRaw[0] : cicloRaw

    if (!ciclo) return false
    if (ciclo.status !== "aberto") return false
    if (ciclo.status_respostas !== "aberto") return false

    const inicio = ciclo.data_inicio_respostas
      ? new Date(ciclo.data_inicio_respostas)
      : null

    const fim = ciclo.data_fim_respostas
      ? new Date(ciclo.data_fim_respostas)
      : null

    if (inicio && agora < inicio) return false
    if (fim && agora > fim) return false

    return true
  })

  const formularioIds = formulariosDisponiveis.map((item) => item.id)

  const { data: participacoes, error: participacoesError } = await supabase
    .from("feedback_participacoes")
    .select("formulario_id, respondido_em")
    .eq("user_id", user.id)
    .in(
      "formulario_id",
      formularioIds.length > 0
        ? formularioIds
        : ["00000000-0000-0000-0000-000000000000"],
    )

  if (participacoesError) {
    console.error("Erro ao buscar participações:", participacoesError)
    throw new Error("Não foi possível buscar suas participações.")
  }

  const respondidos = new Map(
    (participacoes ?? []).map((item) => [
      item.formulario_id,
      item.respondido_em,
    ]),
  )

  return formulariosDisponiveis.map((formulario) => {
    const permiteMultiplasRespostas =
      formulario.categoria === "feedback_gestor_colaborador"

    return {
      ...formulario,
      total_perguntas: formulario.feedback_perguntas?.length ?? 0,
      respondido: respondidos.has(formulario.id),
      respondido_em: respondidos.get(formulario.id) ?? null,
      permite_multiplas_respostas: permiteMultiplasRespostas,
    }
  })
}

export async function getFeedbackFormularioParaResponder(formularioId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("id, nome, role")
    .eq("id", user.id)
    .maybeSingle()

  if (perfilError || !perfil) {
    console.error("Erro ao buscar perfil do usuário:", perfilError)
    throw new Error("Não foi possível verificar o perfil do usuário.")
  }

  const disponibilidade =
    await verificarDisponibilidadeFormularioFeedback(formularioId)

  if (!disponibilidade.aberto) {
    throw new Error(
      disponibilidade.motivo ??
        "Este formulário não está disponível para respostas.",
    )
  }

  const { data: formulario, error } = await supabase
    .from("feedback_formularios")
    .select(
      `
      id,
      titulo,
      categoria,
      confidencialidade,
      instrucoes,
      status,
      publico_alvo,
      feedback_ciclos (
        id,
        nome,
        status,
        status_respostas,
        data_inicio_respostas,
        data_fim_respostas
      ),
      feedback_perguntas (
        id,
        ordem,
        pergunta,
        tipo_resposta
      )
    `,
    )
    .eq("id", formularioId)
    .eq("status", "aberto")
    .single()

  if (error || !formulario) {
    console.error("Erro ao buscar formulário:", error)
    throw new Error("Formulário não encontrado ou não está aberto.")
  }

  const permiteMultiplasRespostas =
    formulario.categoria === "feedback_gestor_colaborador"

  const { data: participacao } = await supabase
    .from("feedback_participacoes")
    .select("id, respondido_em")
    .eq("formulario_id", formularioId)
    .eq("user_id", user.id)
    .maybeSingle()

  let colaboradores: Array<{
    id: string
    nome: string
    departamento: string | null
    ja_avaliado: boolean
  }> = []

  if (permiteMultiplasRespostas) {
    const { data: colaboradoresData, error: colaboradoresError } = await supabase
      .from("users")
      .select("id, nome")
      .eq("status", "ativo")
      .eq("role", "COLABORADOR")
      .order("nome", { ascending: true })

    if (colaboradoresError) {
      console.error("Erro ao buscar colaboradores:", colaboradoresError)
      throw new Error("Não foi possível buscar os colaboradores ativos.")
    }

    const colaboradorIds = (colaboradoresData ?? []).map((item) => item.id)

    const { data: departamentosData, error: departamentosError } =
      colaboradorIds.length > 0
        ? await supabase
            .from("user_departments")
            .select("user_id, departments(name)")
            .in("user_id", colaboradorIds)
        : { data: [], error: null }

    if (departamentosError) {
      console.error("Erro ao buscar departamentos:", departamentosError)
      throw new Error("Não foi possível buscar os departamentos.")
    }

    const departamentosPorUsuario = new Map<string, string>()

    for (const vinculo of departamentosData ?? []) {
      const departamentoRaw = vinculo.departments
      const departamento = Array.isArray(departamentoRaw)
        ? departamentoRaw[0]?.name
        : departamentoRaw?.name

      if (departamento) {
        departamentosPorUsuario.set(vinculo.user_id, departamento)
      }
    }

    const { data: respostasGestor, error: respostasGestorError } =
      await supabase
        .from("feedback_respostas")
        .select("avaliado_user_id")
        .eq("formulario_id", formularioId)
        .eq("respondente_user_id", user.id)
        .not("avaliado_user_id", "is", null)

    if (respostasGestorError) {
      console.error(
        "Erro ao buscar colaboradores já avaliados:",
        respostasGestorError,
      )
      throw new Error("Não foi possível verificar as avaliações já enviadas.")
    }

    const avaliados = new Set(
      (respostasGestor ?? [])
        .map((item) => item.avaliado_user_id)
        .filter((id): id is string => Boolean(id)),
    )

    colaboradores = (colaboradoresData ?? []).map((colaborador) => ({
      id: colaborador.id,
      nome: colaborador.nome,
      departamento: departamentosPorUsuario.get(colaborador.id) ?? null,
      ja_avaliado: avaliados.has(colaborador.id),
    }))
  }

  return {
    formulario: {
      ...formulario,
      feedback_perguntas: [...(formulario.feedback_perguntas ?? [])].sort(
        (a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0),
      ),
    },
    jaRespondido: permiteMultiplasRespostas ? false : Boolean(participacao),
    respondidoEm: participacao?.respondido_em ?? null,
    permiteMultiplasRespostas,
    colaboradores,
    usuario: {
      id: user.id,
      email: user.email ?? null,
      nome:
        perfil.nome ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        null,
    },
  }
}

export async function responderFeedbackInterno(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Usuário não autenticado.")
  }

  const formularioId = String(formData.get("formulario_id") ?? "")
  const nome = String(formData.get("nome") ?? "").trim()
  const departamentoInformado = String(
    formData.get("departamento") ?? "",
  ).trim()
  const avaliadoUserId = String(
    formData.get("avaliado_user_id") ?? "",
  ).trim()

  if (!formularioId) {
    throw new Error("Formulário inválido.")
  }

  const disponibilidade =
    await verificarDisponibilidadeFormularioFeedback(formularioId)

  if (!disponibilidade.aberto) {
    throw new Error(
      disponibilidade.motivo ??
        "Este formulário não está disponível para respostas.",
    )
  }

  const { data: formulario, error: formularioError } = await supabase
    .from("feedback_formularios")
    .select(
      `
      id,
      titulo,
      categoria,
      confidencialidade,
      status,
      publico_alvo,
      feedback_perguntas (
        id,
        ordem,
        pergunta,
        tipo_resposta
      )
    `,
    )
    .eq("id", formularioId)
    .eq("status", "aberto")
    .single()

  if (formularioError || !formulario) {
    console.error("Erro ao buscar formulário:", formularioError)
    throw new Error("Formulário não encontrado ou fechado.")
  }

  const isGestorColaborador =
    formulario.categoria === "feedback_gestor_colaborador"

  const { data: participacaoExistente, error: participacaoExistenteError } =
    await supabase
      .from("feedback_participacoes")
      .select("id")
      .eq("formulario_id", formularioId)
      .eq("user_id", user.id)
      .maybeSingle()

  if (participacaoExistenteError) {
    console.error(
      "Erro ao verificar participação existente:",
      participacaoExistenteError,
    )
    throw new Error("Não foi possível verificar sua participação.")
  }

  if (participacaoExistente && !isGestorColaborador) {
    throw new Error("Você já respondeu este formulário.")
  }

  const isAnonimo = formulario.confidencialidade === "anonimo"

  const respondenteNome = isAnonimo
    ? null
    : nome ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      null

  const respondenteEmail = isAnonimo ? null : (user.email ?? null)

  let avaliadoNome: string | null =
    formulario.categoria === "feedback_geral_empresa"
      ? respondenteNome
      : null
  let avaliadoId: string | null = null
  let departamentoResposta = departamentoInformado || null

  if (isGestorColaborador) {
    if (!avaliadoUserId) {
      throw new Error("Selecione o colaborador que será avaliado.")
    }

    const { data: colaborador, error: colaboradorError } = await supabase
      .from("users")
      .select("id, nome, role, status")
      .eq("id", avaliadoUserId)
      .maybeSingle()

    if (
      colaboradorError ||
      !colaborador ||
      String(colaborador.role ?? "").toUpperCase() !== "COLABORADOR" ||
      colaborador.status !== "ativo"
    ) {
      console.error("Erro ao validar colaborador avaliado:", colaboradorError)
      throw new Error("O colaborador selecionado não está disponível.")
    }

    const { data: vinculoDepartamento, error: departamentoError } =
      await supabase
        .from("user_departments")
        .select("departments(name)")
        .eq("user_id", colaborador.id)
        .maybeSingle()

    if (departamentoError) {
      console.error(
        "Erro ao buscar departamento do colaborador:",
        departamentoError,
      )
      throw new Error("Não foi possível identificar o departamento.")
    }

    const departamentoRaw = vinculoDepartamento?.departments
    const departamentoColaborador = Array.isArray(departamentoRaw)
      ? departamentoRaw[0]?.name
      : departamentoRaw?.name

    const { data: respostaDuplicada, error: respostaDuplicadaError } =
      await supabase
        .from("feedback_respostas")
        .select("id")
        .eq("formulario_id", formulario.id)
        .eq("respondente_user_id", user.id)
        .eq("avaliado_user_id", colaborador.id)
        .maybeSingle()

    if (respostaDuplicadaError) {
      console.error(
        "Erro ao verificar avaliação duplicada:",
        respostaDuplicadaError,
      )
      throw new Error("Não foi possível verificar a avaliação selecionada.")
    }

    if (respostaDuplicada) {
      throw new Error("Você já avaliou este colaborador neste ciclo.")
    }

    avaliadoId = colaborador.id
    avaliadoNome = colaborador.nome
    departamentoResposta = departamentoColaborador ?? null
  }

  const { data: resposta, error: respostaError } = await supabase
    .from("feedback_respostas")
    .insert({
      formulario_id: formulario.id,
      respondente_user_id: isAnonimo ? null : user.id,
      respondente_nome: respondenteNome,
      respondente_email: respondenteEmail,
      avaliado_user_id: avaliadoId,
      avaliado_nome: avaliadoNome,
      departamento: departamentoResposta,
      anonimo: isAnonimo,
      origem_arquivo: null,
      data_inicio: new Date().toISOString(),
      data_conclusao: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (respostaError || !resposta) {
    console.error("Erro ao salvar resposta:", respostaError)

    if (respostaError?.code === "23505" && isGestorColaborador) {
      throw new Error("Você já avaliou este colaborador neste ciclo.")
    }

    throw new Error("Não foi possível salvar a resposta.")
  }

  const itens = (formulario.feedback_perguntas ?? [])
    .map((pergunta) => {
      const valor = String(formData.get(`pergunta_${pergunta.id}`) ?? "").trim()

      if (!valor) return null

      const valorNumerico = Number(valor.replace(",", "."))
      const respostaNumero = Number.isFinite(valorNumerico)
        ? valorNumerico
        : null

      return {
        resposta_id: resposta.id,
        pergunta_id: pergunta.id,
        ordem: pergunta.ordem,
        pergunta: pergunta.pergunta,
        resposta_texto: valor,
        resposta_numero:
          pergunta.tipo_resposta === "escala_1_5" ||
          pergunta.tipo_resposta === "escala_1_10"
            ? respostaNumero
            : null,
      }
    })
    .filter(Boolean)

  if (itens.length > 0) {
    const { error: itensError } = await supabase
      .from("feedback_resposta_itens")
      .insert(itens)

    if (itensError) {
      console.error("Erro ao salvar itens:", itensError)
      throw new Error("Não foi possível salvar os itens da resposta.")
    }
  }

  if (!participacaoExistente) {
    const { error: participacaoError } = await supabase
      .from("feedback_participacoes")
      .insert({
        formulario_id: formulario.id,
        user_id: user.id,
        respondido_em: new Date().toISOString(),
      })

    if (participacaoError) {
      console.error("Erro ao salvar participação:", participacaoError)
      throw new Error("Não foi possível salvar a participação.")
    }
  }

  revalidatePath("/feedback-interno/responder")
  redirect("/feedback-interno/responder?sucesso=1")
}

export async function getFeedbackAcompanhamentoAbertos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("vw_feedback_acompanhamento_abertos")
    .select("*")
    .order("ordem", { ascending: true })

  if (error) {
    console.error("Erro ao buscar acompanhamento de feedbacks:", error)
    throw new Error("Não foi possível buscar o acompanhamento dos feedbacks.")
  }

  return data ?? []
}

export type FeedbackAnaliseFiltros = {
  cicloId?: string
  tipoFormulario?: string
  categoria?: string
  equipe?: string
}

export async function getFeedbackAnaliseResultados(
  filtros?: FeedbackAnaliseFiltros,
) {
  const supabase = await createClient()

  const equipeSelecionada = filtros?.equipe ?? "todos"

  const departamentosFiltro =
    equipeSelecionada !== "todos"
      ? departamentosPorEquipe[equipeSelecionada] ?? [equipeSelecionada]
      : []

  let query = supabase
    .from("vw_feedback_analise_executiva")
    .select("*")
    .not("media_ciclo_anterior", "is", null)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("formulario_titulo", { ascending: true })
    .order("ordem", { ascending: true })

  if (equipeSelecionada === "todos") {
    query = query.eq("departamento", "Todos")
  } else {
    query = query.in("departamento", departamentosFiltro)
  }

  if (filtros?.categoria && filtros.categoria !== "todos") {
    query = query.eq("categoria", filtros.categoria)
  }


  if (filtros?.cicloId) {
    query = query.eq("ciclo_id", filtros.cicloId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar análise dos feedbacks:", error)
    throw new Error("Não foi possível buscar a análise dos feedbacks.")
  }

  let ciclosQuery = supabase
    .from("vw_feedback_analise_executiva")
    .select("ciclo_id, ciclo_nome, ano, mes, departamento, categoria")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })

  if (equipeSelecionada === "todos") {
    ciclosQuery = ciclosQuery.eq("departamento", "Todos")
  } else {
    ciclosQuery = ciclosQuery.in("departamento", departamentosFiltro)
  }

  if (filtros?.categoria && filtros.categoria !== "todos") {
    ciclosQuery = ciclosQuery.eq("categoria", filtros.categoria)
  }


  const { data: ciclosData, error: ciclosError } = await ciclosQuery

  if (ciclosError) {
    console.error("Erro ao buscar ciclos da análise:", ciclosError)
    throw new Error("Não foi possível buscar os ciclos da análise.")
  }

  const ciclosMap = new Map<
    string,
    {
      id: string
      nome: string
      ano: number
      mes: number
    }
  >()

  for (const item of ciclosData ?? []) {
    if (!item.ciclo_id) continue

    ciclosMap.set(item.ciclo_id, {
      id: item.ciclo_id,
      nome: item.ciclo_nome,
      ano: Number(item.ano ?? 0),
      mes: Number(item.mes ?? 0),
    })
  }

  const ciclos = Array.from(ciclosMap.values()).sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano
    return b.mes - a.mes
  })

  const cicloSelecionadoId = filtros?.cicloId ?? ciclos[0]?.id ?? null

  return {
    linhas: data ?? [],
    ciclos,
    cicloSelecionadoId,
  }
}

type StatusRespostasFeedback = "fechado" | "aberto" | "encerrado"

type FeedbackCicloDisponibilidade = {
  id: string
  nome: string | null
  status_respostas: StatusRespostasFeedback
  data_inicio_respostas: string | null
  data_fim_respostas: string | null
}

async function verificarPermissaoGerenciarFeedback() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      autorizado: false,
      message: "Usuário não autenticado.",
    }
  }

  const { data: perfil, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error || !perfil) {
    return {
      autorizado: false,
      message: "Não foi possível verificar a permissão do usuário.",
    }
  }

  const rolesPermitidas = ["GESTOR", "DIRETOR"]

  if (!rolesPermitidas.includes(perfil.role)) {
    return {
      autorizado: false,
      message:
        "Você não tem permissão para alterar a disponibilidade do ciclo.",
    }
  }

  return {
    autorizado: true,
    message: null,
  }
}

function avaliarDisponibilidadeCiclo(ciclo: FeedbackCicloDisponibilidade) {
  const agora = new Date()

  const inicio = ciclo.data_inicio_respostas
    ? new Date(ciclo.data_inicio_respostas)
    : null

  const fim = ciclo.data_fim_respostas
    ? new Date(ciclo.data_fim_respostas)
    : null

  if (ciclo.status_respostas !== "aberto") {
    if (ciclo.status_respostas === "encerrado") {
      return {
        aberto: false,
        motivo: "Este ciclo de feedback já foi encerrado.",
      }
    }

    return {
      aberto: false,
      motivo: "Este ciclo de feedback ainda não foi liberado para respostas.",
    }
  }

  if (inicio && agora < inicio) {
    return {
      aberto: false,
      motivo: "Este formulário ainda não está disponível para resposta.",
    }
  }

  if (fim && agora > fim) {
    return {
      aberto: false,
      motivo: "O período de resposta deste formulário já foi encerrado.",
    }
  }

  return {
    aberto: true,
    motivo: null,
  }
}

export async function verificarDisponibilidadeFormularioFeedback(
  formularioId: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      aberto: false,
      motivo: "Usuário não autenticado.",
      ciclo: null,
    }
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (perfilError || !perfil) {
    return {
      aberto: false,
      motivo: "Não foi possível verificar o perfil do usuário.",
      ciclo: null,
    }
  }

  const { data: formulario, error: formularioError } = await supabase
    .from("feedback_formularios")
    .select("id, titulo, ciclo_id, status, publico_alvo")
    .eq("id", formularioId)
    .maybeSingle()

  if (formularioError || !formulario) {
    return {
      aberto: false,
      motivo: "Formulário de feedback não encontrado.",
      ciclo: null,
    }
  }

  if (formulario.status !== "aberto") {
    return {
      aberto: false,
      motivo: "Este formulário de feedback está fechado.",
      ciclo: null,
    }
  }

  const role = String(perfil.role ?? "").toUpperCase()
  const publicoAlvo = String(formulario.publico_alvo ?? "").toLowerCase()
  const podeResponderComoGestor = ["GESTOR", "DIRETOR"].includes(role)

  const publicoPermitido =
    publicoAlvo === "colaborador" ||
    (publicoAlvo === "gestor" && podeResponderComoGestor)

  if (!publicoPermitido) {
    return {
      aberto: false,
      motivo: "Este formulário não está disponível para o seu perfil.",
      ciclo: null,
    }
  }

  const { data: ciclo, error: cicloError } = await supabase
    .from("feedback_ciclos")
    .select(
      "id, nome, status_respostas, data_inicio_respostas, data_fim_respostas",
    )
    .eq("id", formulario.ciclo_id)
    .maybeSingle()

  if (cicloError || !ciclo) {
    return {
      aberto: false,
      motivo: "Ciclo de feedback não encontrado.",
      ciclo: null,
    }
  }

  const disponibilidade = avaliarDisponibilidadeCiclo(
    ciclo as FeedbackCicloDisponibilidade,
  )

  return {
    aberto: disponibilidade.aberto,
    motivo: disponibilidade.motivo,
    ciclo,
  }
}

export async function alterarStatusRespostasCicloFeedback(
  cicloId: string,
  statusRespostas: StatusRespostasFeedback,
) {
  const permissao = await verificarPermissaoGerenciarFeedback()

  if (!permissao.autorizado) {
    return {
      success: false,
      message: permissao.message,
    }
  }

  const supabase = await createClient()

  const payload: {
    status_respostas: StatusRespostasFeedback
    aberto_em?: string | null
    encerrado_em?: string | null
  } = {
    status_respostas: statusRespostas,
  }

  if (statusRespostas === "aberto") {
    payload.aberto_em = new Date().toISOString()
    payload.encerrado_em = null
  }

  if (statusRespostas === "encerrado") {
    payload.encerrado_em = new Date().toISOString()
  }

  if (statusRespostas === "fechado") {
    payload.aberto_em = null
    payload.encerrado_em = null
  }

  const { error } = await supabase
    .from("feedback_ciclos")
    .update(payload)
    .eq("id", cicloId)

  if (error) {
    return {
      success: false,
      message: `Erro ao atualizar ciclo: ${error.message}`,
    }
  }

  revalidatePath("/feedback-interno")
  revalidatePath("/feedback-interno/responder")
  revalidatePath("/feedback-interno/acompanhamento")
  revalidatePath("/feedback-interno/analise")

  return {
    success: true,
    message:
      statusRespostas === "aberto"
        ? "Ciclo liberado para respostas."
        : statusRespostas === "encerrado"
          ? "Ciclo encerrado com sucesso."
          : "Ciclo fechado para respostas.",
  }
}
