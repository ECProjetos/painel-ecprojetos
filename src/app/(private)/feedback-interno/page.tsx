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
import { Input } from "@/components/ui/input"
import {
  getFeedbackCiclos,
  getFeedbackHistorico,
} from "@/app/actions/feedback-interno"
import {
  ClipboardList,
  Eye,
  Filter,
  X,
  FileText,
  BarChart3,
} from "lucide-react"

type PageProps = {
  searchParams: Promise<{
    cicloId?: string
    categoria?: string
    departamento?: string
    colaborador?: string
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

function formatDate(value: string | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatCategoria(categoria: string | null) {
  if (!categoria) return "-"

  const labels: Record<string, string> = {
    feedback_geral_empresa: "Feedback Geral",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Técnico e Operacional",
    feedback_gestor_colaborador: "Gestor para Colaborador",
  }

  return labels[categoria] ?? categoria
}

function getCategoriaBadgeVariant(categoria: string | null) {
  if (categoria === "feedback_geral_empresa") return "default"
  if (categoria === "feedback_colaborador_gestor") return "secondary"
  if (categoria === "feedback_tecnico_operacional") return "outline"
  if (categoria === "feedback_gestor_colaborador") return "secondary"

  return "outline"
}

function getOrigemLabel(origem: string | null) {
  if (!origem) return "Sistema"
  return origem
}

export default async function FeedbackInternoPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filtros = {
    cicloId: params.cicloId || undefined,
    categoria: params.categoria || undefined,
    departamento: params.departamento || undefined,
    colaborador: params.colaborador || undefined,
  }

  const [historico, ciclos] = await Promise.all([
    getFeedbackHistorico(filtros),
    getFeedbackCiclos(),
  ])

  const totalRespostas = historico.length
  const totalCiclos = new Set(historico.map((item) => item.ciclo_id)).size
  const totalFormularios = new Set(historico.map((item) => item.formulario_id))
    .size

  const totalAnonimos = historico.filter((item) => item.anonimo).length
  const totalIdentificados = historico.filter((item) => !item.anonimo).length

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
            <BreadcrumbPage>Feedback Interno</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Histórico de Feedbacks Internos
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Consulta dos feedbacks internos importados e registrados no
              sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="w-fit">
              <Link href="/feedback-interno/acompanhamento">
                <BarChart3 className="mr-2 h-4 w-4" />
                Acompanhamento
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-fit">
              <Link href="/feedback-interno/arquivos">
                <FileText className="mr-2 h-4 w-4" />
                Arquivos históricos
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Respostas
              </CardTitle>
              <CardDescription>Total filtrado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalRespostas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Ciclos
              </CardTitle>
              <CardDescription>Períodos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalCiclos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Formulários
              </CardTitle>
              <CardDescription>Tipos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalFormularios}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Anônimos
              </CardTitle>
              <CardDescription>Confidenciais</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalAnonimos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Identificados
              </CardTitle>
              <CardDescription>Individuais</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalIdentificados}</p>
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
              Filtre por ciclo, tipo de feedback, departamento ou colaborador.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                  Departamento
                </label>
                <Input
                  name="departamento"
                  defaultValue={params.departamento ?? ""}
                  placeholder="Ex: Engenharia"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                  Colaborador
                </label>
                <Input
                  name="colaborador"
                  defaultValue={params.colaborador ?? ""}
                  placeholder="Nome"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="w-full">
                  Aplicar
                </Button>

                <Button type="button" variant="outline" asChild>
                  <Link href="/feedback-interno">
                    <X className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </form>

            {params.categoria && (
              <p className="mt-3 text-xs text-gray-500">
                Observação: nos feedbacks anônimos, o sistema não exibe nome nem
                e-mail do respondente.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              Lista dos feedbacks cadastrados na base histórica.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {historico.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum feedback encontrado para os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-hidden rounded-md border">
                <div className="max-h-[650px] overflow-auto">
                  <Table className="min-w-[1150px]">
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow>
                        <TableHead>Ciclo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Respondente</TableHead>
                        <TableHead>Avaliado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Conclusão</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {historico.map((item) => (
                        <TableRow key={item.resposta_id}>
                          <TableCell className="font-medium">
                            {item.ciclo_nome}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={getCategoriaBadgeVariant(item.categoria)}
                            >
                              {formatCategoria(item.categoria)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {item.anonimo ? (
                              <Badge variant="secondary">Anônimo</Badge>
                            ) : (
                              (item.respondente_nome ?? "-")
                            )}
                          </TableCell>

                          <TableCell>{item.avaliado_nome ?? "-"}</TableCell>

                          <TableCell>{item.departamento ?? "-"}</TableCell>

                          <TableCell>
                            {formatDate(item.data_conclusao)}
                          </TableCell>

                          <TableCell>{item.quantidade_itens ?? 0}</TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {getOrigemLabel(item.origem_resumida)}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/feedback-interno/${item.resposta_id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
