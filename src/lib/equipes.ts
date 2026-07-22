/**
 * Regras corporativas de agrupamento de departamentos em equipes operacionais.
 *
 * O banco ainda preserva os departamentos históricos para não quebrar dados,
 * relatórios e questionários específicos. A aplicação, porém, pode tratá-los
 * como uma única equipe para filtros, permissões e visualização.
 */

export const EQUIPE_ENGENHARIA_SUSTENTABILIDADE =
  "Engenharia e Sustentabilidade"

const ALIASES_ENGENHARIA_SUSTENTABILIDADE = [
  "Departamento de Engenharia",
  "Engenharia",
  "Engenharia Consultiva e Arquitetura",
  "Engenharia Construtiva e Arquitetura",
  "Departamento de Meio Ambiente e Geoprocessamento",
  "Meio Ambiente",
  "Meio Ambiente e Geoprocessamento",
  "Sustentabilidade",
  "Engenharia/Sustentabilidade",
  "Departamento de Engenharia e Sustentabilidade",
  "Engenharia e Meio Ambiente",
  "Departamento de Engenharia e Meio Ambiente",
  EQUIPE_ENGENHARIA_SUSTENTABILIDADE,
] as const

function normalizarTexto(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const ALIASES_ENGENHARIA_SUSTENTABILIDADE_NORMALIZADOS = new Set(
  ALIASES_ENGENHARIA_SUSTENTABILIDADE.map(normalizarTexto),
)

export function isEquipeEngenhariaSustentabilidade(
  equipe: string | null | undefined,
) {
  if (!equipe?.trim()) return false

  const equipeNormalizada = normalizarTexto(equipe)

  return (
    ALIASES_ENGENHARIA_SUSTENTABILIDADE_NORMALIZADOS.has(equipeNormalizada) ||
    (equipeNormalizada.includes("engenharia") &&
      (equipeNormalizada.includes("sustentabilidade") ||
        equipeNormalizada.includes("meio ambiente") ||
        equipeNormalizada.includes("geoprocessamento")))
  )
}

export function normalizarEquipeOperacional(
  equipe: string | null | undefined,
): string | null {
  const nome = equipe?.trim()

  if (!nome) return null

  if (isEquipeEngenhariaSustentabilidade(nome)) {
    return EQUIPE_ENGENHARIA_SUSTENTABILIDADE
  }

  return nome
}

/**
 * Retorna todos os valores históricos que podem estar gravados no banco para
 * a equipe selecionada. É usado em consultas com `.in(...)` ou filtros locais.
 */
export function getAliasesEquipeOperacional(
  equipe: string | null | undefined,
): string[] {
  const nome = equipe?.trim()

  if (!nome) return []

  if (isEquipeEngenhariaSustentabilidade(nome)) {
    return [...ALIASES_ENGENHARIA_SUSTENTABILIDADE]
  }

  return [nome]
}

export function pertenceEquipeOperacional(
  departamento: string | null | undefined,
  equipe: string | null | undefined,
) {
  const equipeNormalizada = normalizarEquipeOperacional(equipe)
  const departamentoNormalizado = normalizarEquipeOperacional(departamento)

  return Boolean(
    equipeNormalizada &&
      departamentoNormalizado &&
      equipeNormalizada === departamentoNormalizado,
  )
}
