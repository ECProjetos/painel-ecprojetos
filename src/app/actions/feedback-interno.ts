"use server";

import { createClient } from "@/utils/supabase/server";

export type FeedbackHistoricoFiltros ={ 
    cicloId?: string;
    tipoFormulario?: string;
    categoria?: string;
    colaborador?: string;
    departamento?: string;
};

export async function getFeedbackCiclos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedback_ciclos")
    .select("id, nome, ano, mes, periodo, status, created_at")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });

  if (error) {
    console.error("Erro ao buscar ciclos de feedback:", error);
    throw new Error("Não foi possível buscar os ciclos de feedback.");
  }

  return data ?? [];
}

export async function getFeedbackHistorico(filtros?: FeedbackHistoricoFiltros) {
  const supabase = await createClient();

  let query = supabase
    .from("vw_feedback_historico")
    .select("*")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("data_conclusao", { ascending: false });

  if (filtros?.cicloId) {
    query = query.eq("ciclo_id", filtros.cicloId);
  }

  if (filtros?.tipoFormulario) {
    query = query.eq("tipo_formulario", filtros.tipoFormulario);
  }

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria);
  }

  if (filtros?.departamento) {
    query = query.ilike("departamento", `%${filtros.departamento}%`);
  }

  if (filtros?.colaborador) {
    query = query.or(
      `respondente_nome.ilike.%${filtros.colaborador}%,avaliado_nome.ilike.%${filtros.colaborador}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar histórico de feedbacks:", error);
    throw new Error("Não foi possível buscar o histórico de feedbacks.");
  }

  return data ?? [];
}

export async function getFeedbackRespostaDetalhe(respostaId: string) {
  const supabase = await createClient();

  const { data: resposta, error: respostaError } = await supabase
    .from("feedback_respostas")
    .select(`
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
    `)
    .eq("id", respostaId)
    .single();

  if (respostaError) {
    console.error("Erro ao buscar resposta de feedback:", respostaError);
    throw new Error("Não foi possível buscar a resposta do feedback.");
  }

  const { data: itens, error: itensError } = await supabase
    .from("feedback_resposta_itens")
    .select("*")
    .eq("resposta_id", respostaId)
    .order("ordem", { ascending: true });

  if (itensError) {
    console.error("Erro ao buscar itens da resposta:", itensError);
    throw new Error("Não foi possível buscar os itens da resposta.");
  }

  const { data: anexos, error: anexosError } = await supabase
    .from("feedback_anexos")
    .select("*")
    .eq("resposta_id", respostaId);

  if (anexosError) {
    console.error("Erro ao buscar anexos:", anexosError);
    throw new Error("Não foi possível buscar os anexos do feedback.");
  }

  return {
    resposta,
    itens: itens ?? [],
    anexos: anexos ?? [],
  };
}

export type FeedbackConsolidadoFiltros = {
    cicloId?: string;
    categoria?: string;
    departamento?: string;
};

export async function getFeedbackConsolidado(filtros?: FeedbackConsolidadoFiltros) {    
    const supabase = await createClient();

    let query = supabase
    .from("vw_feedback_consolidado")
    .select("*")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("categoria", { ascending: true })
    .order("departamento", { ascending: true });

    if (filtros?.cicloId) {
        query = query.eq("ciclo_id", filtros.cicloId);
    }

    if (filtros?.categoria) {
        query = query.eq("categoria", filtros.categoria);
    }

    if (filtros?.departamento) {
        query = query.ilike("departamento", `%${filtros.departamento}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao buscar consolidado de feedbacks:", error);
        throw new Error("Não foi possível buscar o consolidado de feedbacks.");
    }

    return data ?? [];
}

export type FeedbackConsolidadoDetalheFiltros = {
    cicloId: string;
    categoria: string;
    departamento?: string;
  };
  
  export async function getFeedbackConsolidadoDetalhe(
    filtros: FeedbackConsolidadoDetalheFiltros
  ) {
    const supabase = await createClient();
  
    let queryResumo = supabase
      .from("vw_feedback_consolidado")
      .select("*")
      .eq("ciclo_id", filtros.cicloId)
      .eq("categoria", filtros.categoria);
  
    let queryPerguntas = supabase
      .from("vw_feedback_consolidado_perguntas")
      .select("*")
      .eq("ciclo_id", filtros.cicloId)
      .eq("categoria", filtros.categoria)
      .order("ordem", { ascending: true });
  
    let queryComentarios = supabase
      .from("feedback_resposta_itens")
      .select(`
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
      `)
      .eq("feedback_respostas.feedback_formularios.ciclo_id", filtros.cicloId)
      .eq("feedback_respostas.feedback_formularios.categoria", filtros.categoria)
      .eq("feedback_respostas.feedback_formularios.confidencialidade", "anonimo")
      .is("resposta_numero", null)
      .not("resposta_texto", "is", null)
      .order("ordem", { ascending: true });
  
    if (filtros.departamento) {
      queryResumo = queryResumo.eq("departamento", filtros.departamento);
      queryPerguntas = queryPerguntas.eq("departamento", filtros.departamento);
      queryComentarios = queryComentarios.eq(
        "feedback_respostas.departamento",
        filtros.departamento
      );
    }
  
    const [
      { data: resumo, error: resumoError },
      { data: perguntas, error: perguntasError },
      { data: comentarios, error: comentariosError },
    ] = await Promise.all([queryResumo, queryPerguntas, queryComentarios]);
  
    if (resumoError) {
      console.error("Erro ao buscar resumo consolidado:", resumoError);
      throw new Error("Não foi possível buscar o resumo consolidado.");
    }
  
    if (perguntasError) {
      console.error("Erro ao buscar perguntas consolidadas:", perguntasError);
      throw new Error("Não foi possível buscar as perguntas consolidadas.");
    }
  
    if (comentariosError) {
      console.error("Erro ao buscar comentários consolidados:", comentariosError);
      throw new Error("Não foi possível buscar os comentários consolidados.");
    }
  
    return {
      resumo: resumo ?? [],
      perguntas: perguntas ?? [],
      comentarios: comentarios ?? [],
    };
  }