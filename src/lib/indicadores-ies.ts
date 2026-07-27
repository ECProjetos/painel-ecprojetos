export const DATA_INICIO_NOVA_ESCALA_IES = "2026-08-01";

export const opcoesNotaIes = [
  {
    value: "1",
    titulo: "1",
    descricao: "Não aprovada; exigiu retrabalho significativo",
  },
  {
    value: "2",
    titulo: "2",
    descricao: "Exigiu ajustes relevantes",
  },
  {
    value: "3",
    titulo: "3",
    descricao: "Exigiu ajustes moderados",
  },
  {
    value: "4",
    titulo: "4",
    descricao: "Aprovada com pequenos ajustes",
  },
  {
    value: "5",
    titulo: "5",
    descricao: "Aprovada na primeira submissão, sem ajustes significativos",
  },
] as const;

/**
 * Utilizada pelas telas que trabalham apenas com ano e trimestre.
 *
 * Atenção: para validar uma entrega individual, deve ser utilizada
 * usaNovaEscalaIesPorData(), pois julho de 2026 ainda segue a regra antiga.
 */
export function usaNovaEscalaIesPorPeriodo(
  ano?: number | null,
  trimestre?: number | null,
) {
  if (!ano || !trimestre) {
    return false;
  }

  return ano > 2026 || (ano === 2026 && trimestre >= 3);
}

/**
 * Regra efetiva para cada entrega.
 * A nova escala começa em 01/08/2026.
 */
export function usaNovaEscalaIesPorData(dataEntrega?: string | null) {
  if (!dataEntrega) {
    return false;
  }

  const dataNormalizada = dataEntrega.slice(0, 10);

  return dataNormalizada >= DATA_INICIO_NOVA_ESCALA_IES;
}

export function getDescricaoNotaIes(nota?: number | null) {
  if (
    !Number.isInteger(nota) ||
    Number(nota) < 1 ||
    Number(nota) > 5
  ) {
    return null;
  }

  return (
    opcoesNotaIes.find(
      (opcao) => Number(opcao.value) === Number(nota),
    )?.descricao ?? null
  );
}

export function formatarRespostaIes(params: {
  iesNota?: number | null;
  aprovadoPrimeira?: boolean | null;
}) {
  const descricao = getDescricaoNotaIes(params.iesNota);

  if (descricao && params.iesNota) {
    return `${params.iesNota} — ${descricao}`;
  }

  if (params.aprovadoPrimeira === true) {
    return "Sim";
  }

  if (params.aprovadoPrimeira === false) {
    return "Não";
  }

  return "—";
}

export function getDescricaoIesRelatorio(params: {
  iesNota?: number | null;
  aprovadoPrimeira?: boolean | null;
}) {
  const descricao = getDescricaoNotaIes(params.iesNota);

  if (descricao && params.iesNota) {
    return `Nota ${params.iesNota}: ${descricao}.`;
  }

  if (params.aprovadoPrimeira === true) {
    return "Aprovada na primeira submissão, sem necessidade de ajustes significativos.";
  }

  if (params.aprovadoPrimeira === false) {
    return "Não aprovada na primeira submissão, pois houve necessidade de ajustes significativos.";
  }

  return "IES não informado.";
}