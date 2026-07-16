import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, MessageSquareText } from "lucide-react";
import { getFeedbackConsolidadoDetalhe } from "@/app/actions/feedback-interno";

type PageProps = {
  searchParams: Promise<{
    cicloId?: string;
    categoria?: string;
    departamento?: string;
  }>;
};

function formatCategoria(categoria: string | null | undefined) {
  if (!categoria) return "-";

  const labels: Record<string, string> = {
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Operacional",
  };

  return labels[categoria] ?? categoria;
}

function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";

  const number = Number(value);

  if (!Number.isFinite(number)) return "-";

  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMediaBadgeClass(value: number | string | null | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "bg-gray-100 text-gray-700";
  }

  if (number >= 4.5) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (number >= 3.5) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-800";
}

export default async function FeedbackConsolidadoPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  if (!params.cicloId || !params.categoria) {
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
              <BreadcrumbPage>Consolidado</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Filtro incompleto</CardTitle>
            <CardDescription>
              Selecione um ciclo e um tipo de feedback para visualizar o
              consolidado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/feedback-interno">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { resumo, perguntas, comentarios } =
    await getFeedbackConsolidadoDetalhe({
      cicloId: params.cicloId,
      categoria: params.categoria,
      departamento: params.departamento || undefined,
    });

  const primeiroResumo = resumo[0];

  const totalRespostas = resumo.reduce(
    (acc, item) => acc + Number(item.total_respostas ?? 0),
    0
  );

  const totalItens = resumo.reduce(
    (acc, item) => acc + Number(item.total_itens ?? 0),
    0
  );

  const mediaGeral =
    resumo.length > 0
      ? resumo.reduce((acc, item) => {
          return acc + Number(item.media_geral ?? 0);
        }, 0) / resumo.length
      : null;

  const podeMostrarComentarios = totalRespostas >= 3;

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
            <BreadcrumbPage>Consolidado</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Consolidado de Feedback
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Visualização consolidada dos feedbacks anônimos, sem identificação
              dos respondentes.
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
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Informações gerais do grupo selecionado.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <p className="text-sm font-medium text-gray-500">Ciclo</p>
                <p className="text-base font-semibold">
                  {primeiroResumo?.ciclo_nome ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tipo de feedback
                </p>
                <Badge variant="outline">
                  {formatCategoria(params.categoria)}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Departamento
                </p>
                <p className="text-base font-semibold">
                  {params.departamento || "Todos"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Respostas
                </p>
                <p className="text-base font-semibold">{totalRespostas}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Média geral
                </p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getMediaBadgeClass(
                    mediaGeral
                  )}`}
                >
                  {formatNumber(mediaGeral)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Este consolidado preserva a confidencialidade dos respondentes. Os
              comentários só são exibidos quando o grupo possui pelo menos 3
              respostas.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Média por pergunta</CardTitle>
            <CardDescription>
              Critérios avaliados no grupo selecionado.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {perguntas.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma pergunta encontrada para este filtro.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {perguntas.map((item) => (
                  <div
                    key={`${item.formulario_id}-${item.departamento}-${item.ordem}-${item.pergunta}`}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.ordem}</Badge>
                          <p className="font-medium text-gray-900">
                            {item.pergunta}
                          </p>
                        </div>

                        <p className="text-sm text-gray-500">
                          {item.total_respostas} respostas
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${getMediaBadgeClass(
                          item.media_pergunta
                        )}`}
                      >
                        Média {formatNumber(item.media_pergunta)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              Comentários qualitativos
            </CardTitle>
            <CardDescription>
              Respostas abertas agrupadas sem identificação do respondente.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!podeMostrarComentarios ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Comentários ocultos para preservar a confidencialidade, pois
                  este grupo possui menos de 3 respostas.
                </p>
              </div>
            ) : comentarios.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum comentário textual encontrado para este filtro.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comentarios.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <p className="mb-2 text-sm font-medium text-gray-900">
                      {item.pergunta}
                    </p>

                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {item.resposta_texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Total de itens avaliados no consolidado: {totalItens}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}