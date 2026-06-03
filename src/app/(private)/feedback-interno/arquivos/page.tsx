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
import { FileText, ArrowLeft, ExternalLink, Filter, X } from "lucide-react"
import {
  getFeedbackAnexosHistoricos,
  getFeedbackCiclos,
} from "@/app/actions/feedback-interno"

type PageProps = {
  searchParams: Promise<{
    cicloId?: string
    categoria?: string
  }>
}

const categorias = [
  {
    value: "",
    label: "Todos",
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

function formatCategoria(categoria: string | null | undefined) {
  if (!categoria) return "-"

  const labels: Record<string, string> = {
    feedback_geral_empresa: "Feedback Geral",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Técnico e Operacional",
    feedback_gestor_colaborador: "Gestor para Colaborador",
  }

  return labels[categoria] ?? categoria
}

function formatConfidencialidade(value: string | null | undefined) {
  if (value === "anonimo") return "Anônimo"
  if (value === "identificado") return "Identificado"

  return "-"
}

export default async function FeedbackArquivosPage({
  searchParams,
}: PageProps) {
  const params = await searchParams

  const filtros = {
    cicloId: params.cicloId || undefined,
    categoria: params.categoria || undefined,
  }

  const [anexos, ciclos] = await Promise.all([
    getFeedbackAnexosHistoricos(filtros),
    getFeedbackCiclos(),
  ])

  const totalPdfs = anexos.length
  const totalCiclos = new Set(anexos.map((item) => item.ciclo_id)).size
  const totalTipos = new Set(
    anexos
      .map((item) => item.feedback_formularios?.[0]?.categoria)
      .filter(Boolean),
  ).size

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
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
            <BreadcrumbPage>Arquivos Históricos</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Arquivos Históricos de Feedback
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              PDFs originais dos formulários antigos, organizados por ciclo e
              tipo de avaliação.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/feedback-interno">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                PDFs
              </CardTitle>
              <CardDescription>Total filtrado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalPdfs}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Ciclos
              </CardTitle>
              <CardDescription>Períodos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalCiclos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Tipos
              </CardTitle>
              <CardDescription>Tipos de avaliação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalTipos}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre os PDFs por ciclo ou tipo de feedback.
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
                  defaultValue={params.cicloId ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
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
                  <Link href="/feedback-interno/arquivos">
                    <X className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDFs históricos</CardTitle>
            <CardDescription>
              Lista dos PDFs importados para o Storage do Supabase.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {anexos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum PDF encontrado para os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="max-h-[650px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Confidencialidade</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {anexos.map((anexo) => (
                      <TableRow key={anexo.id}>
                        <TableCell className="font-medium">
                          {anexo.feedback_ciclos?.[0]?.nome ?? "-"}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {formatCategoria(
                              anexo.feedback_formularios?.[0]?.categoria,
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              anexo.feedback_formularios?.[0]?.confidencialidade ===
                              "anonimo"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {formatConfidencialidade(
                              anexo.feedback_formularios?.[0]?.confidencialidade,
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell>{anexo.nome_arquivo}</TableCell>

                        <TableCell className="text-right">
                          {anexo.signed_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={anexo.signed_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Abrir
                              </a>
                            </Button>
                          ) : (
                            <Badge variant="secondary">Indisponível</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
