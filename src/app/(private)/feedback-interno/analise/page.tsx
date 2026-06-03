import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  BarChart3,
  Filter,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import { getFeedbackAnaliseResultados } from "@/app/actions/feedback-interno"

type PageProps = {
  searchParams: Promise<{
    cicloId?: string
    categoria?: string
  }>
}

const categorias = [
  {
    value: "",
    label: "Todos os feedbacks",
  },
  {
    value: "feedback_geral_empresa",
    label: "Feedback Geral da Empresa",
  },
  {
    value: "feedback_colaborador_gestor",
    label: "Colaborador para Gestor",
  },
  {
    value: "feedback_tecnico_operacional",
    label: "Técnico e Operacional",
  },
  {
    value: "feedback_gestor_colaborador",
    label: "Gestor para Colaborador",
  },
]

function formatScore100(value: number | string | null | undefined) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "-"

  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function getPrioridadeVariant(value: string | null | undefined) {
  if (value === "Alta") return "destructive" as const
  if (value === "Média") return "secondary" as const
  return "outline" as const
}

function getTendenciaVariant(value: string | null | undefined) {
  if (value === "Melhorou") return "default" as const
  if (value === "Piorou") return "destructive" as const
  return "secondary" as const
}

function getClassificacaoVariant(value: string | null | undefined) {
  if (value === "Excelente") return "default" as const
  if (value === "Bom") return "outline" as const
  if (value === "Atenção") return "secondary" as const
  if (value === "Crítico") return "destructive" as const
  return "outline" as const
}

function formatCategoria(categoria: string | null | undefined) {
  const labels: Record<string, string> = {
    feedback_geral_empresa: "Feedback Geral",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Técnico e Operacional",
    feedback_gestor_colaborador: "Gestor para Colaborador",
  }

  return categoria ? (labels[categoria] ?? categoria) : "-"
}

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "-"

  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatVariation(value: number | string | null | undefined) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "-"

  const prefix = number > 0 ? "+" : ""

  return `${prefix}${number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getVariacaoBadge(value: number | string | null | undefined) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return {
      label: "Sem comparação",
      variant: "secondary" as const,
    }
  }

  if (number > 0) {
    return {
      label: "Melhorou",
      variant: "default" as const,
    }
  }

  if (number < 0) {
    return {
      label: "Piorou",
      variant: "destructive" as const,
    }
  }

  return {
    label: "Estável",
    variant: "secondary" as const,
  }
}

function truncateText(value: string | null | undefined, max = 110) {
  if (!value) return "-"

  if (value.length <= max) return value

  return `${value.slice(0, max)}...`
}

export default async function FeedbackAnalisePage({ searchParams }: PageProps) {
  const params = await searchParams

  const { linhas, ciclos, cicloSelecionadoId } =
    await getFeedbackAnaliseResultados({
      cicloId: params.cicloId || undefined,
      categoria: params.categoria || undefined,
    })

  const cicloSelecionado = ciclos.find(
    (ciclo) => ciclo.id === cicloSelecionadoId,
  )

  const totalIndicadores = linhas.length

  const indicadoresMelhoraram = linhas.filter(
    (item) => item.tendencia === "Melhorou",
  ).length

  const indicadoresPioraram = linhas.filter(
    (item) => item.tendencia === "Piorou",
  ).length

  const prioridadesAltas = linhas.filter(
    (item) => item.prioridade === "Alta",
  ).length

  const scoresValidos = linhas
    .map((item) => Number(item.media_atual_100))
    .filter((value) => Number.isFinite(value))

  const scoreExecutivo =
    scoresValidos.length > 0
      ? scoresValidos.reduce((acc, value) => acc + value, 0) /
        scoresValidos.length
      : 0

  const variacoesValidas = linhas
    .map((item) => Number(item.variacao_100))
    .filter((value) => Number.isFinite(value))

  const variacaoMedia =
    variacoesValidas.length > 0
      ? variacoesValidas.reduce((acc, value) => acc + value, 0) /
        variacoesValidas.length
      : 0

  const pontosCriticos = [...linhas]
    .filter((item) => item.prioridade === "Alta" || item.prioridade === "Média")
    .sort((a, b) => {
      const prioridadeA =
        a.prioridade === "Alta" ? 1 : a.prioridade === "Média" ? 2 : 3
      const prioridadeB =
        b.prioridade === "Alta" ? 1 : b.prioridade === "Média" ? 2 : 3

      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB

      return Number(a.media_atual_100 ?? 0) - Number(b.media_atual_100 ?? 0)
    })
    .slice(0, 5)

  const pontosFortes = [...linhas]
    .filter((item) => item.classificacao_atual === "Excelente")
    .sort(
      (a, b) => Number(b.media_atual_100 ?? 0) - Number(a.media_atual_100 ?? 0),
    )
    .slice(0, 5)

  const melhoresIndicadores = [...linhas]
    .filter((item) => Number.isFinite(Number(item.variacao_media)))
    .sort(
      (a, b) => Number(b.variacao_media ?? 0) - Number(a.variacao_media ?? 0),
    )
    .slice(0, 3)

  const pioresIndicadores = [...linhas]
    .filter((item) => Number.isFinite(Number(item.variacao_media)))
    .sort(
      (a, b) => Number(a.variacao_media ?? 0) - Number(b.variacao_media ?? 0),
    )
    .slice(0, 3)

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4 pt-0">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/inicio">
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/feedback-interno">
                Feedback Interno
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Análise</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Análise dos Resultados dos Feedbacks
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Evolução dos indicadores avaliados nos ciclos de feedback interno.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/feedback-interno">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre por ciclo e tipo de feedback para analisar a evolução.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                  Ciclo
                </label>

                <select
                  name="cicloId"
                  defaultValue={params.cicloId ?? cicloSelecionadoId ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ciclos.map((ciclo) => (
                    <option key={ciclo.id} value={ciclo.id}>
                      {ciclo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                  Tipo de feedback
                </label>

                <select
                  name="categoria"
                  defaultValue={params.categoria ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categorias.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="w-full">
                  Aplicar
                </Button>

                <Button type="button" variant="outline" asChild>
                  <Link href="/feedback-interno/analise">
                    <X className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Ciclo analisado
              </CardTitle>
              <CardDescription>Comparado ao ciclo anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {cicloSelecionado?.nome ?? "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Score executivo
              </CardTitle>
              <CardDescription>Média normalizada 0 a 100</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {formatScore100(scoreExecutivo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Variação média
              </CardTitle>
              <CardDescription>Em pontos na escala 0 a 100</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {formatVariation(variacaoMedia)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Melhoraram / Pioraram
              </CardTitle>
              <CardDescription>Indicadores do ciclo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {indicadoresMelhoraram}/{indicadoresPioraram}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Prioridade alta
              </CardTitle>
              <CardDescription>Exigem plano de ação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{prioridadesAltas}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pontos críticos para ação</CardTitle>
              <CardDescription>
                Indicadores com maior necessidade de atenção da gestão.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {pontosCriticos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum ponto crítico encontrado para os filtros selecionados.
                </p>
              ) : (
                pontosCriticos.map((item) => (
                  <div
                    key={`${item.formulario_titulo}-${item.ordem}-critico`}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getPrioridadeVariant(item.prioridade)}>
                        {item.prioridade}
                      </Badge>

                      <Badge variant={getTendenciaVariant(item.tendencia)}>
                        {item.tendencia}
                      </Badge>

                      <Badge variant="outline">
                        {formatCategoria(item.categoria)}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {item.pergunta}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Score atual: {formatScore100(item.media_atual_100)} |
                      Variação: {formatVariation(item.variacao_100)}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.recomendacao}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pontos fortes da empresa</CardTitle>
              <CardDescription>
                Indicadores com melhor avaliação no ciclo selecionado.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {pontosFortes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum ponto forte encontrado para os filtros selecionados.
                </p>
              ) : (
                pontosFortes.map((item) => (
                  <div
                    key={`${item.formulario_titulo}-${item.ordem}-forte`}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={getClassificacaoVariant(
                          item.classificacao_atual,
                        )}
                      >
                        {item.classificacao_atual}
                      </Badge>

                      <Badge variant={getTendenciaVariant(item.tendencia)}>
                        {item.tendencia}
                      </Badge>

                      <Badge variant="outline">
                        {formatCategoria(item.categoria)}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {item.pergunta}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Score atual: {formatScore100(item.media_atual_100)} |
                      Variação: {formatVariation(item.variacao_100)}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {item.recomendacao}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evolução por pergunta</CardTitle>
            <CardDescription>
              Comparação da média atual com o ciclo anterior para cada
              indicador.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {linhas.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum dado comparativo encontrado para os filtros
                  selecionados.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-hidden rounded-md border">
                <div className="max-h-[650px] overflow-auto">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Score anterior</TableHead>
                        <TableHead>Score atual</TableHead>
                        <TableHead>Variação</TableHead>
                        <TableHead>Classificação</TableHead>
                        <TableHead>Tendência</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Recomendação</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {linhas.map((item) => {
                        const variacao = getVariacaoBadge(item.variacao_media)

                        return (
                          <TableRow
                            key={`${item.formulario_id}-${item.ordem}-${item.pergunta}`}
                          >
                            <TableCell>
                              <Badge variant="outline">
                                {formatCategoria(item.categoria)}
                              </Badge>
                            </TableCell>

                            <TableCell className="max-w-[420px]">
                              <p className="whitespace-normal font-medium">
                                {item.pergunta}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Escala:{" "}
                                {item.escala === "escala_1_10"
                                  ? "1 a 10"
                                  : "1 a 5"}
                              </p>
                            </TableCell>

                            <TableCell>
                              {formatScore100(item.media_anterior_100)}
                            </TableCell>

                            <TableCell>
                              {formatScore100(item.media_atual_100)}
                            </TableCell>

                            <TableCell>
                              {formatVariation(item.variacao_100)}
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={getClassificacaoVariant(
                                  item.classificacao_atual,
                                )}
                              >
                                {item.classificacao_atual}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={getTendenciaVariant(item.tendencia)}
                              >
                                {item.tendencia}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={getPrioridadeVariant(item.prioridade)}
                              >
                                {item.prioridade}
                              </Badge>
                            </TableCell>

                            <TableCell className="max-w-[360px]">
                              <p className="whitespace-normal text-sm text-gray-700">
                                {item.recomendacao}
                              </p>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Esta análise usa médias agregadas por pergunta e por ciclo. Nos
              formulários anônimos, os resultados são exibidos apenas de forma
              consolidada, sem identificar respondentes.
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Variação média dos indicadores filtrados:{" "}
              {formatVariation(variacaoMedia)}.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
