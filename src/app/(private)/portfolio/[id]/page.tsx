import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FolderKanban,
  Landmark,
  Pencil,
  TrendingUp,
} from "lucide-react"

import { getPortfolioCaseById } from "@/app/actions/portfolio"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortfolioPdfButton } from "@/components/portfolio/portfolio-pdf-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"

type PortfolioCasePageProps = {
  params: Promise<{
    id: string
  }>
}

function formatDepartmentName(name: string) {
  return name
    .replace(/^Departamento de /i, "")
    .replace(/^Departamento da /i, "")
    .replace(/^Departamento do /i, "")
    .replace(/^Departamento /i, "")
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString("pt-BR")}`
  }
}

function formatProjectedDemand(value: number, unit: "TEU" | "t" | null) {
  const formattedValue = value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })

  return unit ? `${formattedValue} ${unit}` : formattedValue
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

export default async function PortfolioCasePage({
  params,
}: PortfolioCasePageProps) {
  const { id } = await params
  const projectId = Number(id)

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound()
  }

  const project = await getPortfolioCaseById(projectId)

  if (!project) {
    notFound()
  }

  const portfolio = project.portfolio

  const assuntos = project.tags.filter((tag) => tag.category === "assunto")

  const setores = project.tags.filter((tag) => tag.category === "setor")

  const hasExportableData =
    portfolio.projected_demand !== null || portfolio.capex !== null

  return (
    <div className="min-h-full w-full rounded-2xl border bg-white p-6 shadow-lg dark:bg-[#1c1c20]">
      {/* BREADCRUMB */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
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
              <BreadcrumbLink href="/portfolio">Portfólio</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{project.code ?? project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        {/* TOPO */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-5 -ml-2">
            <Link href="/portfolio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portfólio
            </Link>
          </Button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap gap-2">
                {project.code && (
                  <Badge variant="outline">{project.code}</Badge>
                )}

                <Badge>Portfólio preenchido</Badge>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>

              {project.description && (
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/portfolio/${project.id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar dados
                </Link>
              </Button>

              <PortfolioPdfButton project={project} />

              <Button asChild variant="outline">
                <Link href={`/projetos/${project.id}`}>Abrir projeto</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* CLASSIFICAÇÕES */}
        {(project.departments.length > 0 ||
          assuntos.length > 0 ||
          setores.length > 0) && (
          <Card className="mb-6">
            <CardContent className="grid gap-6 pt-6 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Áreas
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.departments.length > 0 ? (
                    project.departments.map((department) => (
                      <Badge key={department.id}>
                        {formatDepartmentName(department.name)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Não informado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Assuntos
                </p>

                <div className="flex flex-wrap gap-2">
                  {assuntos.length > 0 ? (
                    assuntos.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Não informado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Setores
                </p>

                <div className="flex flex-wrap gap-2">
                  {setores.length > 0 ? (
                    setores.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Não informado
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NÚMEROS PRINCIPAIS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {portfolio.completion_date && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Conclusão</p>

                  <p className="font-semibold">
                    {formatDate(portfolio.completion_date)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {project.estimated_hours !== null && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Horas estimadas
                  </p>

                  <p className="font-semibold">
                    {project.estimated_hours.toLocaleString("pt-BR")} h
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {portfolio.projected_demand !== null && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Landmark className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Demanda projetada
                  </p>

                  <p className="break-words font-semibold">
                    {formatProjectedDemand(
                      portfolio.projected_demand,
                      portfolio.projected_demand_unit,
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {portfolio.capex !== null && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <TrendingUp className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">CAPEX</p>

                  <p className="break-words font-semibold">
                    {formatCurrency(portfolio.capex, portfolio.currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CONTEÚDO DO CASE */}
        <div className="grid gap-6 lg:grid-cols-2">
          {portfolio.executive_summary && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderKanban className="h-5 w-5" />
                  Resumo executivo
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                  {portfolio.executive_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {portfolio.challenge && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desafio / contexto</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                  {portfolio.challenge}
                </p>
              </CardContent>
            </Card>
          )}

          {portfolio.solution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solução desenvolvida</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                  {portfolio.solution}
                </p>
              </CardContent>
            </Card>
          )}

          {portfolio.results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultados alcançados</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                  {portfolio.results}
                </p>
              </CardContent>
            </Card>
          )}

          {portfolio.quantitative_results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Resultados quantitativos
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                  {portfolio.quantitative_results}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AVISO DE DADOS DA EXPORTAÇÃO */}
        {hasExportableData && !portfolio.show_values_in_pdf && (
          <p className="mt-5 text-xs text-muted-foreground">
            A demanda projetada e o CAPEX estão disponíveis internamente, mas
            estão configurados para não aparecer na exportação em PDF.
          </p>
        )}
      </div>
    </div>
  )
}
