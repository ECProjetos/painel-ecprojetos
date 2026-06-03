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

export async function getFeedbackCiclos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("feedback_ciclos")
    .select("id, nome, ano, mes, periodo, status, created_at")
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

export type FeedbackAnexosFiltros = {
  cicloId?: string
  categoria?: string
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
      feedback_ciclos (
        id,
        nome,
        ano,
        mes,
        periodo,
        status
      ),
      feedback_perguntas (
        id
      )
    `,
    )
    .eq("status", "aberto")
    .eq("publico_alvo", "colaborador")
    .eq("feedback_ciclos.status", "aberto")
    .order("ordem", { ascending: true })

  if (error) {
    console.error("Erro ao buscar formulários abertos:", error)
    throw new Error("Não foi possível buscar os formulários abertos.")
  }

  const formularioIds = (formularios ?? []).map((item) => item.id)

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

  return (formularios ?? []).map((formulario) => ({
    ...formulario,
    total_perguntas: formulario.feedback_perguntas?.length ?? 0,
    respondido: respondidos.has(formulario.id),
    respondido_em: respondidos.get(formulario.id) ?? null,
  }))
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
      feedback_ciclos (
        id,
        nome,
        status
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

  const { data: participacao } = await supabase
    .from("feedback_participacoes")
    .select("id, respondido_em")
    .eq("formulario_id", formularioId)
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    formulario: {
      ...formulario,
      feedback_perguntas: [...(formulario.feedback_perguntas ?? [])].sort(
        (a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0),
      ),
    },
    jaRespondido: Boolean(participacao),
    respondidoEm: participacao?.respondido_em ?? null,
    usuario: {
      id: user.id,
      email: user.email ?? null,
      nome:
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
  const departamento = String(formData.get("departamento") ?? "").trim()

  if (!formularioId) {
    throw new Error("Formulário inválido.")
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

  const { data: participacaoExistente } = await supabase
    .from("feedback_participacoes")
    .select("id")
    .eq("formulario_id", formularioId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (participacaoExistente) {
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

  const avaliadoNome =
    formulario.categoria === "feedback_geral_empresa" ? respondenteNome : null

  const { data: resposta, error: respostaError } = await supabase
    .from("feedback_respostas")
    .insert({
      formulario_id: formulario.id,
      respondente_user_id: isAnonimo ? null : user.id,
      respondente_nome: respondenteNome,
      respondente_email: respondenteEmail,
      avaliado_nome: avaliadoNome,
      departamento: departamento || null,
      anonimo: isAnonimo,
      origem_arquivo: null,
      data_inicio: new Date().toISOString(),
      data_conclusao: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (respostaError || !resposta) {
    console.error("Erro ao salvar resposta:", respostaError)
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

  revalidatePath("/feedback-interno/responder")
  redirect("/feedback-interno/responder?sucesso=1")
}

export async function getFeedbackAcompanhamentoAbertos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vw_feedback_acompanhamento_abertos")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar acompanhamento de feedbacks:", error);
    throw new Error("Não foi possível buscar o acompanhamento dos feedbacks.");
  }

  return data ?? [];
}

export type FeedbackAnaliseFiltros = {
  cicloId?: string;
  categoria?: string;
};

export async function getFeedbackAnaliseResultados(
  filtros?: FeedbackAnaliseFiltros
) {
  const supabase = await createClient();

  let query = supabase
    .from("vw_feedback_analise_executiva")
    .select("*")
    .not("media_ciclo_anterior", "is", null)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("formulario_titulo", { ascending: true })
    .order("ordem", { ascending: true });

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar análise dos feedbacks:", error);
    throw new Error("Não foi possível buscar a análise dos feedbacks.");
  }

  const linhas = data ?? [];

  const ciclosMap = new Map<
    string,
    {
      id: string;
      nome: string;
      ano: number;
      mes: number;
    }
  >();

  for (const item of linhas) {
    if (!item.ciclo_id) continue;

    ciclosMap.set(item.ciclo_id, {
      id: item.ciclo_id,
      nome: item.ciclo_nome,
      ano: Number(item.ano ?? 0),
      mes: Number(item.mes ?? 0),
    });
  }

  const ciclos = Array.from(ciclosMap.values()).sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  const cicloSelecionadoId = filtros?.cicloId ?? ciclos[0]?.id ?? null;

  const linhasFiltradas = linhas.filter((item) => {
    if (!cicloSelecionadoId) return true;
    return item.ciclo_id === cicloSelecionadoId;
  });

  return {
    linhas: linhasFiltradas,
    ciclos,
    cicloSelecionadoId,
  };
}