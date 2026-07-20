"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type FeriasStatus = "pendente" | "aprovada" | "reprovada" | "cancelada";
export type FeriasTipo =
  "ferias" | "ausencia" | "atestado" | "day_off" | "licenca";

export type FeriasOrigem = "individual" | "coletiva" | "ajuste_historico";
export type FeriasSituacao =
  "regular" | "atencao" | "urgente" | "vencido" | "concluido";

export type FeriasPeriodoGozoSituacao =
  | "usufruido"
  | "em_gozo"
  | "programado"
  | "pendente";

export type FeriasPeriodoGozo = {
  id: string;
  data_inicio: string;
  data_fim: string;
  data_retorno: string | null;
  dias_corridos: number;
  dias_vendidos: number;
  origem: FeriasOrigem;
  observacao: string | null;
  status: FeriasStatus;
  situacao_gozo: FeriasPeriodoGozoSituacao;
};

export type FeriasSolicitacaoInput = {
  colaboradorId: string;
  dataInicio: string;
  dataFim: string;
  tipo: FeriasTipo;
  observacao?: string;
  periodoAquisitivoId?: string;
  periodoAquisitivoInicio?: string;
  periodoAquisitivoFim?: string;
  diasVendidos?: number;
  adiantamento13?: boolean;
  origem?: FeriasOrigem;
};

export type MinhaFeriasSolicitacaoInput = Omit<
  FeriasSolicitacaoInput,
  "colaboradorId" | "tipo" | "origem"
>;

export type FeriasFiltros = {
  ano?: number;
  mes?: number;
  status?: FeriasStatus | "todos";
  colaborador?: string;
  equipe?: string;
};

export type FeriasConfiguracaoInput = {
  colaboradorId: string;
  regimeContratacao: "clt" | "estagio" | "pj" | "outro";
  ativoGestaoFerias: boolean;
  dataAdmissaoReferencia?: string;
  diasDireitoPadrao?: number;
  observacao?: string;
};

export type FeriasPeriodoAtualizacaoInput = {
  periodoId: string;
  aquisitivoInicio: string;
  aquisitivoFim: string;
  concessivoInicio: string;
  concessivoFim: string;
  diasDireito: number;
  motivoAjuste: string;
  observacao?: string;
};

export type FeriasPeriodoResumo = {
  periodo_id: string;
  colaborador_id: string;
  colaborador_nome: string;
  data_admissao: string | null;
  regime_contratacao: string;
  ativo_gestao_ferias: boolean;
  numero_periodo: number;
  aquisitivo_inicio: string;
  aquisitivo_fim: string;
  concessivo_inicio: string;
  concessivo_fim: string;
  dias_direito: number;
  ajuste_manual: boolean;
  motivo_ajuste: string | null;
  observacao: string | null;
  quantidade_periodos_reservados: number;
  quantidade_periodos_aprovados: number;
  dias_usufruidos: number;
  dias_em_gozo: number;
  dias_programados: number;
  dias_pendentes: number;
  dias_vendidos: number;
  dias_vendidos_pendentes: number;
  primeiro_gozo: string | null;
  ultimo_gozo: string | null;
  possui_ferias_coletivas: boolean;
  periodos_aprovados: FeriasPeriodoGozo[];
  periodos_pendentes: FeriasPeriodoGozo[];
  solicitacoes_sem_vinculo: number;
  saldo_aprovado: number;
  saldo_apos_pendencias: number;
  dias_para_vencer: number;
  situacao: FeriasSituacao;
};

export type FeriasAlerta = FeriasPeriodoResumo;

const EQUIPE_ENGENHARIA_SUSTENTABILIDADE = "Engenharia/Sustentabilidade";

const EQUIPES_ENGENHARIA_SUSTENTABILIDADE = [
  "Departamento de Engenharia",
  "Departamento de Meio Ambiente e Geoprocessamento",
];

async function getUsuarioLogado() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: perfilPorId } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilPorId?.id) {
    return {
      authUser: user,
      publicUserId: perfilPorId.id,
    };
  }

  if (user.email) {
    const { data: perfilPorEmail, error: perfilError } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", user.email)
      .maybeSingle();

    if (perfilError) {
      console.error("Erro ao buscar usuário público por e-mail:", perfilError);
    }

    if (perfilPorEmail?.id) {
      return {
        authUser: user,
        publicUserId: perfilPorEmail.id,
      };
    }
  }

  throw new Error("Usuário autenticado não encontrado na tabela de usuários.");
}

export async function isRhFeriasAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const idsParaVerificar = [user.id];

  if (user.email) {
    const { data: perfil } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", user.email)
      .maybeSingle();

    if (perfil?.id && !idsParaVerificar.includes(perfil.id)) {
      idsParaVerificar.push(perfil.id);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("rh_ferias_permissoes")
    .select("id")
    .in("user_id", idsParaVerificar)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao validar permissão de férias:", error);
    return false;
  }

  return Boolean(data);
}

async function ensureRhFeriasPermission() {
  const user = await getUsuarioLogado();
  const permitido = await isRhFeriasAdmin();

  if (!permitido) {
    throw new Error("Você não tem permissão para acessar a Gestão de Férias.");
  }

  return user;
}

async function getRhFeriasPermissionLevel() {
  const usuario = await getUsuarioLogado();
  const idsParaVerificar = Array.from(
    new Set([usuario.authUser.id, usuario.publicUserId]),
  );

  const { data, error } = await supabaseAdmin
    .from("rh_ferias_permissoes")
    .select("papel")
    .in("user_id", idsParaVerificar)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao identificar nível de permissão de férias:", error);
    return { podeAcessar: false, podeEditarProgramacao: false };
  }

  return {
    podeAcessar: Boolean(data),
    podeEditarProgramacao: data?.papel === "rh",
  };
}

async function ensureRhFeriasEditPermission() {
  const usuario = await ensureRhFeriasPermission();
  const permissao = await getRhFeriasPermissionLevel();

  if (!permissao.podeEditarProgramacao) {
    throw new Error(
      "Somente os responsáveis de RH podem inserir ou alterar períodos aquisitivos.",
    );
  }

  return usuario;
}

function normalizarEquipe(equipe: string | null) {
  if (!equipe) {
    return null;
  }

  if (
    EQUIPES_ENGENHARIA_SUSTENTABILIDADE.includes(equipe) ||
    equipe === EQUIPE_ENGENHARIA_SUSTENTABILIDADE
  ) {
    return EQUIPE_ENGENHARIA_SUSTENTABILIDADE;
  }

  return equipe;
}

function normalizarSolicitacoes(solicitacoes: any[]) {
  return solicitacoes.map((item) => ({
    ...item,
    equipe: normalizarEquipe(item.equipe ?? null),
  }));
}

type PeriodoAquisitivoRegistro = {
  id: string;
  colaborador_id: string;
  aquisitivo_inicio: string;
  aquisitivo_fim: string;
  concessivo_inicio: string;
  concessivo_fim: string;
};

type LocalizarPeriodoInput = {
  colaboradorId: string;
  dataInicio: string;
  periodoAquisitivoId?: string;
  periodoAquisitivoInicio?: string;
  periodoAquisitivoFim?: string;
};

async function associarSolicitacoesLegadasColaborador(
  colaboradorId: string,
) {
  const [solicitacoesResult, periodosResult] = await Promise.all([
    supabaseAdmin
      .from("ferias_solicitacoes")
      .select(
        "id, data_inicio, periodo_aquisitivo_inicio, periodo_aquisitivo_fim",
      )
      .eq("colaborador_id", colaboradorId)
      .eq("tipo", "ferias")
      .in("status", ["pendente", "aprovada"])
      .is("periodo_aquisitivo_id", null),
    supabaseAdmin
      .from("ferias_periodos_aquisitivos")
      .select(
        "id, colaborador_id, aquisitivo_inicio, aquisitivo_fim, concessivo_inicio, concessivo_fim",
      )
      .eq("colaborador_id", colaboradorId),
  ]);

  if (solicitacoesResult.error || periodosResult.error) {
    console.error("Erro ao associar solicitações antigas aos períodos:", {
      solicitacoes: solicitacoesResult.error,
      periodos: periodosResult.error,
    });
    return;
  }

  const periodos = (periodosResult.data ?? []) as PeriodoAquisitivoRegistro[];

  await Promise.all(
    (solicitacoesResult.data ?? []).map(async (solicitacao: any) => {
      let candidatos = periodos.filter(
        (periodo) =>
          solicitacao.periodo_aquisitivo_inicio &&
          solicitacao.periodo_aquisitivo_fim &&
          periodo.aquisitivo_inicio ===
            solicitacao.periodo_aquisitivo_inicio &&
          periodo.aquisitivo_fim === solicitacao.periodo_aquisitivo_fim,
      );

      if (candidatos.length !== 1) {
        candidatos = periodos.filter(
          (periodo) =>
            periodo.aquisitivo_fim < solicitacao.data_inicio &&
            periodo.concessivo_inicio <= solicitacao.data_inicio &&
            periodo.concessivo_fim >= solicitacao.data_inicio,
        );
      }

      // Também permite férias concedidas fora do prazo quando existe apenas
      // um único período adquirido antes do início do gozo.
      if (candidatos.length !== 1) {
        candidatos = periodos.filter(
          (periodo) => periodo.aquisitivo_fim < solicitacao.data_inicio,
        );
      }

      if (candidatos.length !== 1) {
        return;
      }

      const periodo = candidatos[0];
      const { error } = await supabaseAdmin
        .from("ferias_solicitacoes")
        .update({
          periodo_aquisitivo_id: periodo.id,
          periodo_aquisitivo_inicio: periodo.aquisitivo_inicio,
          periodo_aquisitivo_fim: periodo.aquisitivo_fim,
        })
        .eq("id", solicitacao.id)
        .is("periodo_aquisitivo_id", null);

      if (error) {
        console.error(
          `Erro ao associar a solicitação ${solicitacao.id}:`,
          error,
        );
      }
    }),
  );
}

async function localizarPeriodoAquisitivoParaSolicitacao(
  input: LocalizarPeriodoInput,
) {
  if (input.periodoAquisitivoId) {
    const { data, error } = await supabaseAdmin
      .from("ferias_periodos_aquisitivos")
      .select(
        "id, colaborador_id, aquisitivo_inicio, aquisitivo_fim, concessivo_inicio, concessivo_fim",
      )
      .eq("id", input.periodoAquisitivoId)
      .eq("colaborador_id", input.colaboradorId)
      .single();

    if (error || !data) {
      throw new Error(
        "O período aquisitivo selecionado não pertence ao colaborador.",
      );
    }

    return data as PeriodoAquisitivoRegistro;
  }

  const { data: configuracao, error: configuracaoError } = await supabaseAdmin
    .from("ferias_colaboradores_config")
    .select("ativo_gestao_ferias, regime_contratacao")
    .eq("colaborador_id", input.colaboradorId)
    .maybeSingle();

  if (configuracaoError && configuracaoError.code !== "42P01") {
    console.error("Erro ao consultar configuração de férias:", configuracaoError);
  }

  const possuiGestaoClt = Boolean(
    configuracao?.ativo_gestao_ferias &&
      configuracao.regime_contratacao === "clt",
  );

  if (!possuiGestaoClt) {
    return null;
  }

  const { error: gerarError } = await supabaseAdmin.rpc(
    "ferias_gerar_periodos_colaborador",
    { p_colaborador_id: input.colaboradorId },
  );

  if (gerarError) {
    console.error("Erro ao gerar períodos do colaborador:", gerarError);
  }

  const { data: periodosData, error } = await supabaseAdmin
    .from("ferias_periodos_aquisitivos")
    .select(
      "id, colaborador_id, aquisitivo_inicio, aquisitivo_fim, concessivo_inicio, concessivo_fim",
    )
    .eq("colaborador_id", input.colaboradorId)
    .order("concessivo_fim", { ascending: true });

  if (error) {
    console.error("Erro ao localizar período aquisitivo:", error);
    throw new Error("Erro ao localizar o período aquisitivo das férias.");
  }

  const periodos = (periodosData ?? []) as PeriodoAquisitivoRegistro[];
  let candidatos: PeriodoAquisitivoRegistro[];

  if (input.periodoAquisitivoInicio && input.periodoAquisitivoFim) {
    candidatos = periodos.filter(
      (periodo) =>
        periodo.aquisitivo_inicio === input.periodoAquisitivoInicio &&
        periodo.aquisitivo_fim === input.periodoAquisitivoFim,
    );
  } else {
    candidatos = periodos.filter(
      (periodo) =>
        periodo.aquisitivo_fim < input.dataInicio &&
        periodo.concessivo_inicio <= input.dataInicio &&
        periodo.concessivo_fim >= input.dataInicio,
    );

    if (candidatos.length === 0) {
      const adquiridosAntesDoGozo = periodos.filter(
        (periodo) => periodo.aquisitivo_fim < input.dataInicio,
      );

      if (adquiridosAntesDoGozo.length === 1) {
        candidatos = adquiridosAntesDoGozo;
      }
    }
  }

  if (candidatos.length === 1) {
    return candidatos[0];
  }

  if (candidatos.length > 1) {
    throw new Error(
      "Há mais de um período aquisitivo disponível. Selecione o período que deverá fornecer o saldo.",
    );
  }

  throw new Error(
    "Não foi encontrado um período aquisitivo compatível. Confira a data de admissão e os períodos do colaborador.",
  );
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
      data_admissao,
      cargo:cargos(nome),
      user_departments(
        departments(name)
      )
    `,
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Erro ao buscar perfil do colaborador:", error);
    throw new Error("Não foi possível localizar o perfil do colaborador.");
  }

  return data as any;
}

export async function getColaboradoresFerias() {
  await ensureRhFeriasPermission();

  const [{ data, error }, { data: configuracoes, error: configuracoesError }] =
    await Promise.all([
      supabaseAdmin
        .from("users")
        .select(
          `
          id,
          nome,
          email,
          status,
          data_admissao,
          cargo:cargos(nome),
          user_departments(
            departments(name)
          )
        `,
        )
        .eq("status", "ativo")
        .order("nome", { ascending: true }),
      supabaseAdmin.from("ferias_colaboradores_config").select("*"),
    ]);

  if (error) {
    console.error("Erro ao buscar colaboradores:", error);
    throw new Error("Erro ao buscar colaboradores.");
  }

  if (configuracoesError && configuracoesError.code !== "42P01") {
    console.error(
      "Erro ao buscar configurações de férias:",
      configuracoesError,
    );
  }

  const configuracaoPorColaborador = new Map(
    (configuracoes ?? []).map((item: any) => [item.colaborador_id, item]),
  );

  return (data ?? []).map((user: any) => {
    const departamento = user.user_departments?.[0]?.departments?.name ?? null;
    const configuracao = configuracaoPorColaborador.get(user.id) as any;

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      cargo: user.cargo?.nome ?? null,
      equipe: normalizarEquipe(departamento),
      data_admissao: user.data_admissao ?? null,
      configuracao_ferias: configuracao
        ? {
            id: configuracao.id,
            regime_contratacao: configuracao.regime_contratacao,
            ativo_gestao_ferias: configuracao.ativo_gestao_ferias,
            data_admissao_referencia:
              configuracao.data_admissao_referencia ?? null,
            dias_direito_padrao: configuracao.dias_direito_padrao,
            observacao: configuracao.observacao ?? null,
          }
        : null,
    };
  });
}

export async function getFeriasSolicitacoes(filtros?: FeriasFiltros) {
  await ensureRhFeriasPermission();

  let query = supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .order("data_inicio", { ascending: true });

  if (filtros?.ano && filtros?.mes) {
    const inicioMes = `${filtros.ano}-${String(filtros.mes).padStart(2, "0")}-01`;
    const fimMes = new Date(filtros.ano, filtros.mes, 0)
      .toISOString()
      .slice(0, 10);

    query = query.lte("data_inicio", fimMes).gte("data_fim", inicioMes);
  }

  if (filtros?.status && filtros.status !== "todos") {
    query = query.eq("status", filtros.status);
  }

  if (filtros?.colaborador) {
    query = query.ilike("colaborador_nome", `%${filtros.colaborador}%`);
  }

  if (filtros?.equipe) {
    if (filtros.equipe === EQUIPE_ENGENHARIA_SUSTENTABILIDADE) {
      query = query.in("equipe", [
        ...EQUIPES_ENGENHARIA_SUSTENTABILIDADE,
        EQUIPE_ENGENHARIA_SUSTENTABILIDADE,
      ]);
    } else {
      query = query.eq("equipe", filtros.equipe);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar férias:", error);
    throw new Error("Erro ao buscar solicitações de férias.");
  }

  return normalizarSolicitacoes(data ?? []);
}

export async function getFeriasPendentes() {
  await ensureRhFeriasPermission();

  const { data, error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .eq("status", "pendente")
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("Erro ao buscar solicitações pendentes:", error);
    throw new Error("Erro ao buscar solicitações pendentes.");
  }

  return normalizarSolicitacoes(data ?? []);
}

async function garantirPeriodosConfigurados() {
  const { data: configuracoes, error } = await supabaseAdmin
    .from("ferias_colaboradores_config")
    .select("colaborador_id")
    .eq("ativo_gestao_ferias", true)
    .eq("regime_contratacao", "clt");

  if (error) {
    if (error.code === "42P01") {
      return;
    }

    console.error("Erro ao listar configurações de férias:", error);
    return;
  }

  await Promise.all(
    (configuracoes ?? []).map(async (configuracao: any) => {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "ferias_gerar_periodos_colaborador",
        {
          p_colaborador_id: configuracao.colaborador_id,
        },
      );

      if (rpcError) {
        console.error(
          `Erro ao gerar períodos para ${configuracao.colaborador_id}:`,
          rpcError,
        );
        return;
      }

      await associarSolicitacoesLegadasColaborador(
        configuracao.colaborador_id,
      );
    }),
  );
}

export async function getFeriasProgramacao() {
  await ensureRhFeriasPermission();
  await garantirPeriodosConfigurados();

  const { data, error } = await supabaseAdmin
    .from("vw_ferias_programacao")
    .select("*")
    .order("concessivo_fim", { ascending: true })
    .order("colaborador_nome", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return [] as FeriasPeriodoResumo[];
    }

    console.error("Erro ao buscar programação de férias:", error);
    throw new Error("Erro ao buscar a programação consolidada de férias.");
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    periodos_aprovados: Array.isArray(item.periodos_aprovados)
      ? item.periodos_aprovados
      : [],
    periodos_pendentes: Array.isArray(item.periodos_pendentes)
      ? item.periodos_pendentes
      : [],
    quantidade_periodos_aprovados: Number(
      item.quantidade_periodos_aprovados ?? 0,
    ),
    dias_vendidos_pendentes: Number(item.dias_vendidos_pendentes ?? 0),
    solicitacoes_sem_vinculo: Number(item.solicitacoes_sem_vinculo ?? 0),
  })) as FeriasPeriodoResumo[];
}

export async function getFeriasAlertasVencimento() {
  const programacao = await getFeriasProgramacao();

  return programacao.filter(
    (periodo) =>
      periodo.saldo_aprovado > 0 &&
      ["atencao", "urgente", "vencido"].includes(periodo.situacao),
  );
}

async function getPeriodosDisponiveisColaborador(colaboradorId: string) {
  await garantirPeriodosConfigurados();

  const hoje = dataHojeLocal();
  const { data, error } = await supabaseAdmin
    .from("vw_ferias_programacao")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .lte("aquisitivo_fim", hoje)
    .gt("saldo_apos_pendencias", 0)
    .order("concessivo_fim", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return [] as FeriasPeriodoResumo[];
    }

    console.error("Erro ao buscar períodos disponíveis:", error);
    throw new Error("Erro ao buscar seus períodos aquisitivos.");
  }

  return (data ?? []) as FeriasPeriodoResumo[];
}

export async function getFeriasResumo(filtros?: FeriasFiltros) {
  const solicitacoes = await getFeriasSolicitacoes(filtros);
  const hoje = dataHojeLocal();

  const total = solicitacoes.length;
  const pendentes = solicitacoes.filter(
    (item) => item.status === "pendente",
  ).length;
  const aprovadas = solicitacoes.filter(
    (item) => item.status === "aprovada",
  ).length;
  const reprovadas = solicitacoes.filter(
    (item) => item.status === "reprovada",
  ).length;
  const canceladas = solicitacoes.filter(
    (item) => item.status === "cancelada",
  ).length;

  const emFeriasHoje = solicitacoes.filter(
    (item) =>
      item.status === "aprovada" &&
      item.data_inicio <= hoje &&
      item.data_fim >= hoje,
  ).length;

  const conflitos = calcularConflitos(solicitacoes);

  return {
    total,
    pendentes,
    aprovadas,
    reprovadas,
    canceladas,
    emFeriasHoje,
    conflitos: conflitos.length,
  };
}

export async function getFeriasDashboard(filtros?: FeriasFiltros) {
  await ensureRhFeriasPermission();

  const [colaboradores, solicitacoes, pendencias, programacao, permissao] =
    await Promise.all([
      getColaboradoresFerias(),
      getFeriasSolicitacoes(filtros),
      getFeriasPendentes(),
      getFeriasProgramacao(),
      getRhFeriasPermissionLevel(),
    ]);

  const hoje = dataHojeLocal();
  const conflitos = calcularConflitos(solicitacoes);
  const alertasVencimento = programacao.filter(
    (periodo) =>
      periodo.saldo_aprovado > 0 &&
      ["atencao", "urgente", "vencido"].includes(periodo.situacao),
  );

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
  };

  return {
    colaboradores,
    solicitacoes,
    pendencias,
    resumo,
    conflitos,
    programacao,
    alertasVencimento,
    podeEditarProgramacao: permissao.podeEditarProgramacao,
  };
}

export async function salvarConfiguracaoFerias(input: FeriasConfiguracaoInput) {
  const usuario = await ensureRhFeriasEditPermission();

  if (!input.colaboradorId) {
    throw new Error("Selecione um colaborador.");
  }

  const diasDireitoPadrao = input.diasDireitoPadrao ?? 30;

  if (diasDireitoPadrao < 0 || diasDireitoPadrao > 30) {
    throw new Error("Os dias de direito devem estar entre 0 e 30.");
  }

  if (
    input.ativoGestaoFerias &&
    input.regimeContratacao === "clt" &&
    !input.dataAdmissaoReferencia
  ) {
    throw new Error("Informe a data de admissão usada como referência.");
  }

  const { error } = await supabaseAdmin
    .from("ferias_colaboradores_config")
    .upsert(
      {
        colaborador_id: input.colaboradorId,
        regime_contratacao: input.regimeContratacao,
        ativo_gestao_ferias: input.ativoGestaoFerias,
        data_admissao_referencia: input.dataAdmissaoReferencia || null,
        dias_direito_padrao: diasDireitoPadrao,
        observacao: input.observacao || null,
        criado_por: usuario.publicUserId,
        atualizado_por: usuario.publicUserId,
      },
      { onConflict: "colaborador_id" },
    );

  if (error) {
    console.error("Erro ao salvar configuração de férias:", error);
    throw new Error(`Erro ao salvar configuração de férias: ${error.message}`);
  }

  if (
    input.ativoGestaoFerias &&
    input.regimeContratacao === "clt" &&
    input.dataAdmissaoReferencia
  ) {
    const { error: rpcError } = await supabaseAdmin.rpc(
      "ferias_gerar_periodos_colaborador",
      {
        p_colaborador_id: input.colaboradorId,
        p_usuario_id: usuario.publicUserId,
      },
    );

    if (rpcError) {
      console.error("Erro ao gerar períodos aquisitivos:", rpcError);
      throw new Error(
        `Configuração salva, mas houve erro ao gerar períodos: ${rpcError.message}`,
      );
    }

    await associarSolicitacoesLegadasColaborador(input.colaboradorId);
  }

  revalidarFerias();
  return { success: true };
}

export async function atualizarPeriodoAquisitivo(
  input: FeriasPeriodoAtualizacaoInput,
) {
  const usuario = await ensureRhFeriasEditPermission();

  validarIntervaloDatas(
    input.aquisitivoInicio,
    input.aquisitivoFim,
    "período aquisitivo",
  );
  validarIntervaloDatas(
    input.concessivoInicio,
    input.concessivoFim,
    "período concessivo",
  );

  if (input.concessivoInicio <= input.aquisitivoFim) {
    throw new Error(
      "O período concessivo deve começar após o fim do período aquisitivo.",
    );
  }

  if (!input.motivoAjuste.trim()) {
    throw new Error("Informe o motivo da alteração manual.");
  }

  if (input.diasDireito < 0 || input.diasDireito > 30) {
    throw new Error("Os dias de direito devem estar entre 0 e 30.");
  }

  const { error } = await supabaseAdmin
    .from("ferias_periodos_aquisitivos")
    .update({
      aquisitivo_inicio: input.aquisitivoInicio,
      aquisitivo_fim: input.aquisitivoFim,
      concessivo_inicio: input.concessivoInicio,
      concessivo_fim: input.concessivoFim,
      dias_direito: input.diasDireito,
      ajuste_manual: true,
      motivo_ajuste: input.motivoAjuste.trim(),
      observacao: input.observacao || null,
      atualizado_por: usuario.publicUserId,
    })
    .eq("id", input.periodoId);

  if (error) {
    console.error("Erro ao atualizar período aquisitivo:", error);
    throw new Error(`Erro ao atualizar período aquisitivo: ${error.message}`);
  }

  revalidarFerias();
  return { success: true };
}

export async function criarFeriasSolicitacao(input: FeriasSolicitacaoInput) {
  const usuario = await ensureRhFeriasPermission();

  validarDatasSolicitacao(input.dataInicio, input.dataFim);

  if (!input.colaboradorId) {
    throw new Error("Selecione um colaborador.");
  }

  const colaborador = await buscarPerfilCompleto(input.colaboradorId);

  if (colaborador.status !== "ativo") {
    throw new Error("Não é possível lançar férias para colaborador inativo.");
  }

  const equipe = colaborador.user_departments?.[0]?.departments?.name ?? null;
  const cargo = colaborador.cargo?.nome ?? null;

  await inserirSolicitacao({
    colaboradorId: colaborador.id,
    colaboradorNome: colaborador.nome,
    equipe,
    cargo,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipo: input.tipo,
    observacao: input.observacao,
    periodoAquisitivoId: input.periodoAquisitivoId,
    periodoAquisitivoInicio: input.periodoAquisitivoInicio,
    periodoAquisitivoFim: input.periodoAquisitivoFim,
    diasVendidos: input.diasVendidos,
    adiantamento13: input.adiantamento13,
    origem: input.origem ?? "individual",
    criadoPor: usuario.publicUserId,
  });

  revalidarFerias();
  return { success: true };
}

export async function getMinhasFeriasDashboard() {
  const usuario = await getUsuarioLogado();
  const perfil = await buscarPerfilCompleto(usuario.publicUserId);

  const [{ data, error }, periodosDisponiveis] = await Promise.all([
    supabaseAdmin
      .from("ferias_solicitacoes")
      .select("*")
      .eq("colaborador_id", usuario.publicUserId)
      .order("data_inicio", { ascending: false }),
    getPeriodosDisponiveisColaborador(usuario.publicUserId),
  ]);

  if (error) {
    console.error("Erro ao buscar solicitações do colaborador:", error);
    throw new Error("Erro ao buscar suas solicitações de férias.");
  }

  const solicitacoes = normalizarSolicitacoes(data ?? []);

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
      data_admissao: perfil.data_admissao ?? null,
    },
    solicitacoes,
    periodosDisponiveis,
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
  };
}

export async function criarMinhaSolicitacaoFerias(
  input: MinhaFeriasSolicitacaoInput,
) {
  const usuario = await getUsuarioLogado();
  const colaborador = await buscarPerfilCompleto(usuario.publicUserId);

  validarDatasSolicitacao(input.dataInicio, input.dataFim);

  if (colaborador.status !== "ativo") {
    throw new Error("Seu usuário está inativo e não pode criar solicitações.");
  }

  const periodosDisponiveis = await getPeriodosDisponiveisColaborador(
    usuario.publicUserId,
  );

  if (periodosDisponiveis.length > 0 && !input.periodoAquisitivoId) {
    throw new Error("Selecione o período aquisitivo que será utilizado.");
  }

  const equipe = colaborador.user_departments?.[0]?.departments?.name ?? null;
  const cargo = colaborador.cargo?.nome ?? null;

  await inserirSolicitacao({
    colaboradorId: colaborador.id,
    colaboradorNome: colaborador.nome,
    equipe,
    cargo,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    tipo: "ferias",
    observacao: input.observacao,
    periodoAquisitivoId: input.periodoAquisitivoId,
    periodoAquisitivoInicio: input.periodoAquisitivoInicio,
    periodoAquisitivoFim: input.periodoAquisitivoFim,
    diasVendidos: input.diasVendidos,
    adiantamento13: input.adiantamento13,
    origem: "individual",
    criadoPor: usuario.publicUserId,
  });

  revalidarFerias();
  return { success: true };
}

export async function cancelarMinhaSolicitacaoFerias(
  solicitacaoId: string,
  observacao?: string,
) {
  const usuario = await getUsuarioLogado();

  const { data: atual, error: atualError } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("id, colaborador_id, status")
    .eq("id", solicitacaoId)
    .eq("colaborador_id", usuario.publicUserId)
    .single();

  if (atualError || !atual) {
    throw new Error("Solicitação não encontrada.");
  }

  if (atual.status !== "pendente") {
    throw new Error("Somente solicitações pendentes podem ser canceladas.");
  }

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .update({
      status: "cancelada",
      motivo_reprovacao: observacao || "Cancelada pelo colaborador.",
    })
    .eq("id", solicitacaoId)
    .eq("colaborador_id", usuario.publicUserId);

  if (error) {
    console.error("Erro ao cancelar solicitação do colaborador:", error);
    throw new Error("Erro ao cancelar sua solicitação.");
  }

  await supabaseAdmin.from("ferias_historico").insert({
    solicitacao_id: solicitacaoId,
    acao: "cancelada",
    status_anterior: atual.status,
    status_novo: "cancelada",
    observacao: observacao || "Cancelada pelo colaborador.",
    usuario_id: usuario.publicUserId,
  });

  revalidarFerias();
  return { success: true };
}

export async function atualizarStatusFerias(
  solicitacaoId: string,
  status: FeriasStatus,
  observacao?: string,
) {
  const usuario = await ensureRhFeriasPermission();

  const { data: atual, error: atualError } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .select("*")
    .eq("id", solicitacaoId)
    .single();

  if (atualError || !atual) {
    throw new Error("Solicitação não encontrada.");
  }

  let periodoAquisitivoId = atual.periodo_aquisitivo_id as string | null;

  if (status === "aprovada" && atual.tipo === "ferias") {
    const periodo = await localizarPeriodoAquisitivoParaSolicitacao({
      colaboradorId: atual.colaborador_id,
      dataInicio: atual.data_inicio,
      periodoAquisitivoId: periodoAquisitivoId ?? undefined,
      periodoAquisitivoInicio: atual.periodo_aquisitivo_inicio ?? undefined,
      periodoAquisitivoFim: atual.periodo_aquisitivo_fim ?? undefined,
    });

    if (periodo) {
      periodoAquisitivoId = periodo.id;

      if (!atual.periodo_aquisitivo_id) {
        const { error: vinculoError } = await supabaseAdmin
          .from("ferias_solicitacoes")
          .update({
            periodo_aquisitivo_id: periodo.id,
            periodo_aquisitivo_inicio: periodo.aquisitivo_inicio,
            periodo_aquisitivo_fim: periodo.aquisitivo_fim,
          })
          .eq("id", atual.id);

        if (vinculoError) {
          console.error("Erro ao vincular período antes da aprovação:", vinculoError);
          throw new Error(
            "Não foi possível vincular a solicitação ao período aquisitivo.",
          );
        }
      }

      await validarFracionamentoPeriodo({
        periodoId: periodo.id,
        dataInicio: atual.data_inicio,
        dataFim: atual.data_fim,
        diasVendidos: Number(atual.dias_vendidos ?? 0),
        solicitacaoIgnorarId: atual.id,
      });
    }
  }

  const payload: Record<string, unknown> = { status };

  if (status === "aprovada") {
    payload.aprovado_por = usuario.publicUserId;
    payload.aprovado_em = new Date().toISOString();
    payload.motivo_reprovacao = null;
  }

  if (status === "reprovada" || status === "cancelada") {
    payload.motivo_reprovacao = observacao || null;
  }

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .update(payload)
    .eq("id", solicitacaoId);

  if (error) {
    console.error("Erro ao atualizar status das férias:", error);
    throw new Error("Erro ao atualizar status das férias.");
  }

  await supabaseAdmin.from("ferias_historico").insert({
    solicitacao_id: solicitacaoId,
    acao: status,
    status_anterior: atual.status,
    status_novo: status,
    observacao: observacao || null,
    usuario_id: usuario.publicUserId,
  });

  revalidarFerias();
  return { success: true };
}

export async function excluirFeriasSolicitacao(solicitacaoId: string) {
  await ensureRhFeriasPermission();

  const { error } = await supabaseAdmin
    .from("ferias_solicitacoes")
    .delete()
    .eq("id", solicitacaoId);

  if (error) {
    console.error("Erro ao excluir solicitação:", error);
    throw new Error("Erro ao excluir solicitação.");
  }

  revalidarFerias();
  return { success: true };
}

type InserirSolicitacaoInput = {
  colaboradorId: string;
  colaboradorNome: string;
  equipe: string | null;
  cargo: string | null;
  dataInicio: string;
  dataFim: string;
  tipo: FeriasTipo;
  observacao?: string;
  periodoAquisitivoId?: string;
  periodoAquisitivoInicio?: string;
  periodoAquisitivoFim?: string;
  diasVendidos?: number;
  adiantamento13?: boolean;
  origem: FeriasOrigem;
  criadoPor: string;
};

async function inserirSolicitacao(input: InserirSolicitacaoInput) {
  const diasCorridos = calcularDiasCorridos(input.dataInicio, input.dataFim);
  const diasVendidos = input.diasVendidos ?? 0;
  const requerAnaliseInicio = validarInicioFerias(input.dataInicio, input.tipo);

  let periodoAquisitivoId = input.periodoAquisitivoId || null;
  let periodoAquisitivoInicio = input.periodoAquisitivoInicio || null;
  let periodoAquisitivoFim = input.periodoAquisitivoFim || null;

  if (input.tipo === "ferias") {
    const periodo = await localizarPeriodoAquisitivoParaSolicitacao({
      colaboradorId: input.colaboradorId,
      dataInicio: input.dataInicio,
      periodoAquisitivoId: input.periodoAquisitivoId,
      periodoAquisitivoInicio: input.periodoAquisitivoInicio,
      periodoAquisitivoFim: input.periodoAquisitivoFim,
    });

    if (periodo) {
      await validarFracionamentoPeriodo({
        periodoId: periodo.id,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        diasVendidos,
      });

      periodoAquisitivoId = periodo.id;
      periodoAquisitivoInicio = periodo.aquisitivo_inicio;
      periodoAquisitivoFim = periodo.aquisitivo_fim;
    }
  }

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
      periodo_aquisitivo_id: periodoAquisitivoId,
      periodo_aquisitivo_inicio: periodoAquisitivoInicio,
      periodo_aquisitivo_fim: periodoAquisitivoFim,
      dias_vendidos: diasVendidos,
      adiantamento_13: input.adiantamento13 ?? false,
      origem: input.origem,
      requer_analise_inicio: requerAnaliseInicio,
      observacao: input.observacao || null,
      criado_por: input.criadoPor,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao criar solicitação de férias:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      `Erro ao criar solicitação de férias: ${error.message}${
        error.details ? ` - ${error.details}` : ""
      }`,
    );
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
    });

  if (historicoError) {
    console.error("Erro ao criar histórico de férias:", historicoError);
    throw new Error(
      `Solicitação criada, mas houve erro ao salvar histórico: ${historicoError.message}`,
    );
  }
}

type ValidarFracionamentoInput = {
  periodoId: string;
  dataInicio: string;
  dataFim: string;
  diasVendidos: number;
  solicitacaoIgnorarId?: string;
};

async function validarFracionamentoPeriodo(input: ValidarFracionamentoInput) {
  const { data: periodo, error: periodoError } = await supabaseAdmin
    .from("ferias_periodos_aquisitivos")
    .select("*")
    .eq("id", input.periodoId)
    .single();

  if (periodoError || !periodo) {
    throw new Error("Período aquisitivo não encontrado.");
  }

  if (periodo.aquisitivo_fim >= dataHojeLocal()) {
    throw new Error(
      "Este período aquisitivo ainda não foi concluído e não está disponível para solicitação.",
    );
  }

  let query = supabaseAdmin
    .from("ferias_solicitacoes")
    .select("id, dias_corridos, dias_vendidos, data_inicio, data_fim")
    .eq("periodo_aquisitivo_id", input.periodoId)
    .eq("tipo", "ferias")
    .in("status", ["pendente", "aprovada"]);

  if (input.solicitacaoIgnorarId) {
    query = query.neq("id", input.solicitacaoIgnorarId);
  }

  const { data: existentes, error: existentesError } = await query;

  if (existentesError) {
    console.error("Erro ao validar fracionamento:", existentesError);
    throw new Error("Erro ao validar o saldo e o fracionamento das férias.");
  }

  const diasNovoPeriodo = calcularDiasCorridos(input.dataInicio, input.dataFim);

  if (diasNovoPeriodo < 5) {
    throw new Error(
      "Cada período de férias deve possuir no mínimo 5 dias corridos.",
    );
  }

  if (input.diasVendidos < 0 || input.diasVendidos > 10) {
    throw new Error("A quantidade de dias vendidos deve estar entre 0 e 10.");
  }

  const periodosExistentes = existentes ?? [];

  if (periodosExistentes.length >= 3) {
    throw new Error("As férias podem ser divididas em no máximo 3 períodos.");
  }

  const diasReservados = periodosExistentes.reduce(
    (total: number, item: any) =>
      total + Number(item.dias_corridos ?? 0) + Number(item.dias_vendidos ?? 0),
    0,
  );

  const totalComNovaSolicitacao =
    diasReservados + diasNovoPeriodo + input.diasVendidos;
  const diasDireito = Number(periodo.dias_direito ?? 30);

  if (totalComNovaSolicitacao > diasDireito) {
    throw new Error(
      `A solicitação ultrapassa o saldo do período. Direito: ${diasDireito} dias; já reservados: ${diasReservados} dias.`,
    );
  }

  const saldoRestante = diasDireito - totalComNovaSolicitacao;

  if (saldoRestante > 0 && saldoRestante < 5) {
    throw new Error(
      `A divisão deixaria um saldo de ${saldoRestante} dia(s), inferior ao mínimo de 5 dias para outro período.`,
    );
  }

  const possuiPeriodoDe14 =
    diasNovoPeriodo >= 14 ||
    periodosExistentes.some((item: any) => Number(item.dias_corridos) >= 14);

  const quantidadeAposSolicitacao = periodosExistentes.length + 1;

  if (!possuiPeriodoDe14 && saldoRestante < 14) {
    throw new Error(
      "O fracionamento deve manter pelo menos um período com 14 dias corridos ou mais.",
    );
  }

  if (!possuiPeriodoDe14 && quantidadeAposSolicitacao >= 3) {
    throw new Error(
      "O limite de 3 períodos seria atingido sem nenhum período mínimo de 14 dias.",
    );
  }

  return periodo;
}

function validarInicioFerias(dataInicio: string, tipo: FeriasTipo) {
  if (tipo !== "ferias") {
    return false;
  }

  const data = criarDataLocal(dataInicio);
  const diaSemana = data.getDay();

  if (diaSemana === 5) {
    throw new Error("As férias não podem iniciar na sexta-feira.");
  }

  return diaSemana === 4;
}

function validarDatasSolicitacao(dataInicio: string, dataFim: string) {
  validarIntervaloDatas(dataInicio, dataFim, "período solicitado");
}

function validarIntervaloDatas(
  dataInicio: string,
  dataFim: string,
  descricao: string,
) {
  if (!dataInicio || !dataFim) {
    throw new Error(`Informe o início e o fim do ${descricao}.`);
  }

  if (dataFim < dataInicio) {
    throw new Error(
      `A data final do ${descricao} não pode ser anterior à inicial.`,
    );
  }
}

function calcularConflitos(solicitacoes: any[]) {
  const consideradas = solicitacoes.filter((item) =>
    ["pendente", "aprovada"].includes(item.status),
  );

  const conflitos: any[] = [];

  for (let i = 0; i < consideradas.length; i++) {
    for (let j = i + 1; j < consideradas.length; j++) {
      const a = consideradas[i];
      const b = consideradas[j];
      const equipeA = normalizarEquipe(a.equipe ?? null);
      const equipeB = normalizarEquipe(b.equipe ?? null);

      if (!equipeA || !equipeB || equipeA !== equipeB) {
        continue;
      }

      const sobrepoe =
        a.data_inicio <= b.data_fim && a.data_fim >= b.data_inicio;

      if (sobrepoe) {
        conflitos.push({
          equipe: equipeA,
          colaboradorA: a.colaborador_nome,
          colaboradorB: b.colaborador_nome,
          inicioA: a.data_inicio,
          fimA: a.data_fim,
          inicioB: b.data_inicio,
          fimB: b.data_fim,
        });
      }
    }
  }

  return conflitos;
}

function calcularDiasCorridos(dataInicio: string, dataFim: string) {
  const inicio = criarDataLocal(dataInicio);
  const fim = criarDataLocal(dataFim);
  const diferencaMs = fim.getTime() - inicio.getTime();

  return Math.floor(diferencaMs / (1000 * 60 * 60 * 24)) + 1;
}

function criarDataLocal(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function revalidarFerias() {
  revalidatePath("/rh/ferias");
  revalidatePath("/rh/minhas-ferias");
}
