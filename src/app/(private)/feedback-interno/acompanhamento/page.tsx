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
import { ArrowLeft, BarChart3, CheckCircle2, Lock, Users } from "lucide-react"
import { getFeedbackAcompanhamentoAbertos } from "@/app/actions/feedback-interno"

function formatConfidencialidade(value: string | null | undefined) {
  if (value === "anonimo") return "Anônimo"
  if (value === "identificado") return "Identificado"
  return "-"
}
function formatPercent(value: number | string | null | undefined) {
  const number = Number(value)

  if (!Number.isFinite(number)) return "0%"

  return `${number.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}
function formatCategoria(categoria: string | null | undefined) {
  if (!categoria) return "-"

  const labels: Record<string, string> = {
    feedback_geral_empresa: "Feedback Geral",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Operacional",
    feedback_gestor_colaborador: "Gestor para Colaborador",
  }

  return labels[categoria] ?? categoria
}

function getStatusLabel(totalRespostas: number) {
  if (totalRespostas === 0) return "Sem respostas"
  return "Em andamento"
}

function getStatusVariant(totalRespostas: number) {
  if (totalRespostas === 0) return "secondary"
  return "default"
}

export default async function FeedbackAcompanhamentoPage() {
  const acompanhamento = await getFeedbackAcompanhamentoAbertos()

  const cicloAberto = acompanhamento[0]?.ciclo_nome ?? "-"

  const totalFormularios = acompanhamento.length

  const totalColaboradoresEsperados = Number(
    acompanhamento[0]?.total_esperado ?? 0,
  )

  const totalParticipacoes = acompanhamento.reduce(
    (acc, item) => acc + Number(item.total_participacoes ?? 0),
    0,
  )

  const totalPossivel = totalColaboradoresEsperados * totalFormularios

  const totalPendentes = Math.max(totalPossivel - totalParticipacoes, 0)

  const percentualGeral =
    totalPossivel > 0 ? (totalParticipacoes / totalPossivel) * 100 : 0

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
            <BreadcrumbPage>Acompanhamento</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Acompanhamento dos Feedbacks
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Controle dos formulários abertos para preenchimento pelos
              colaboradores.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/feedback-interno">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Ciclo aberto
              </CardTitle>
              <CardDescription>Período atual</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{cicloAberto}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Colaboradores
              </CardTitle>
              <CardDescription>Público esperado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {totalColaboradoresEsperados}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Participações
              </CardTitle>
              <CardDescription>
                {totalParticipacoes} de {totalPossivel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {formatPercent(percentualGeral)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Pendentes
              </CardTitle>
              <CardDescription>Total geral</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalPendentes}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulários abertos</CardTitle>
            <CardDescription>
              Resumo de respostas e participações registradas no ciclo aberto.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {acompanhamento.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum formulário aberto encontrado.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-hidden rounded-md border">
                <div className="overflow-auto">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow>
                        <TableHead>Formulário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Confidencialidade</TableHead>
                        <TableHead>Perguntas</TableHead>
                        <TableHead>Esperado</TableHead>
                        <TableHead>Participações</TableHead>
                        <TableHead>Pendentes</TableHead>
                        <TableHead>Adesão</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {acompanhamento.map((item) => {
                        return (
                          <TableRow key={item.formulario_id}>
                            <TableCell className="font-medium">
                              {item.formulario_titulo}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">
                                {formatCategoria(item.categoria)}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={
                                  item.confidencialidade === "anonimo"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {item.confidencialidade === "anonimo" ? (
                                  <Lock className="mr-1 h-3 w-3" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                {formatConfidencialidade(
                                  item.confidencialidade,
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell>{item.total_perguntas ?? 0}</TableCell>

                            <TableCell>{item.total_esperado ?? 0}</TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                {item.total_participacoes ?? 0}
                              </div>
                            </TableCell>

                            <TableCell>{item.total_pendentes ?? 0}</TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {formatPercent(item.percentual_adesao)}
                                </p>
                                <div className="h-2 w-32 rounded-full bg-gray-100">
                                  <div
                                    className="h-2 rounded-full bg-blue-600"
                                    style={{
                                      width: `${Math.min(
                                        Number(item.percentual_adesao ?? 0),
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={getStatusVariant(
                                  Number(item.total_participacoes ?? 0),
                                )}
                              >
                                {getStatusLabel(
                                  Number(item.total_participacoes ?? 0),
                                )}
                              </Badge>
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
              Nos formulários anônimos, o acompanhamento registra apenas a
              participação do colaborador para evitar duplicidade. A resposta em
              si não fica associada ao nome ou e-mail do respondente.
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Participações registradas: {totalParticipacoes} de {totalPossivel}
              . Pendentes: {totalPendentes}.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
