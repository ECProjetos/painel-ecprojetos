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
import { getFeedbackRespostaDetalhe } from "@/app/actions/feedback-interno";
import { ArrowLeft, ClipboardList } from "lucide-react";

type PageProps = {
  params: Promise<{
    respostaId: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTipoFormulario(tipo: string | null) {
  if (!tipo) return "-";

  const labels: Record<string, string> = {
    feedback_geral: "Feedback Geral da Empresa",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_gestor_colaborador: "Gestor para Colaborador",
    feedback_gestao_operacional: "Técnico e Operacional",
  };

  return labels[tipo] ?? tipo;
}

function formatConfidencialidade(value: string | null | undefined) {
  if (value === "anonimo") return "Anônimo";
  if (value === "identificado") return "Identificado";

  return "-";
}

function getRespostaDisplay(item: {
  resposta_texto: string | null;
  resposta_numero: number | string | null;
}) {
  if (item.resposta_numero !== null && item.resposta_numero !== undefined) {
    return String(item.resposta_numero).replace(".", ",");
  }

  if (item.resposta_texto) {
    return item.resposta_texto;
  }

  return "Sem resposta registrada.";
}

function isNota(item: {
  resposta_texto: string | null;
  resposta_numero: number | string | null;
}) {
  return item.resposta_numero !== null && item.resposta_numero !== undefined;
}

export default async function FeedbackRespostaDetalhePage({ params }: PageProps) {
  const { respostaId } = await params;

  const { resposta, itens, anexos } =
    await getFeedbackRespostaDetalhe(respostaId);

  const formulario = resposta.feedback_formularios;
  const ciclo = formulario?.feedback_ciclos;

  const isAnonimo =
    resposta.anonimo === true || formulario?.confidencialidade === "anonimo";

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
            <BreadcrumbPage>Detalhe</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-700" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Detalhe do Feedback
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Visualização das perguntas e respostas registradas no formulário.
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
            <CardTitle>Informações gerais</CardTitle>
            <CardDescription>
              Dados principais da resposta selecionada.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Ciclo</p>
                <p className="text-base font-semibold">
                  {ciclo?.nome ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Formulário</p>
                <Badge variant="outline">
                  {formatTipoFormulario(formulario?.tipo ?? null)}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Confidencialidade
                </p>
                <Badge variant={isAnonimo ? "secondary" : "default"}>
                  {formatConfidencialidade(formulario?.confidencialidade)}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Respondente
                </p>
                <p className="text-base font-semibold">
                  {isAnonimo ? "Anônimo" : resposta.respondente_nome ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">E-mail</p>
                <p className="text-base font-semibold">
                  {isAnonimo ? "-" : resposta.respondente_email ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Avaliado</p>
                <p className="text-base font-semibold">
                  {resposta.avaliado_nome ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Departamento
                </p>
                <p className="text-base font-semibold">
                  {resposta.departamento ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Conclusão</p>
                <p className="text-base font-semibold">
                  {formatDate(resposta.data_conclusao)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Origem</p>
                <Badge variant="outline">
                  {resposta.origem_arquivo ? "Importado" : "Sistema"}
                </Badge>
              </div>
            </div>

            {isAnonimo && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                Este feedback é anônimo. O sistema exibe as respostas do
                formulário, mas não mostra nome nem e-mail do respondente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perguntas e respostas</CardTitle>
            <CardDescription>
              Conteúdo registrado neste formulário.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {itens.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma pergunta ou resposta encontrada para este feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <Badge variant="secondary">{item.ordem}</Badge>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.pergunta}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md bg-gray-50 p-3">
                      {isNota(item) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Nota:</span>
                          <Badge variant="outline">
                            {getRespostaDisplay(item)}
                          </Badge>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                          {getRespostaDisplay(item)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {anexos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>
                Arquivos vinculados a este feedback.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{anexo.nome_arquivo}</p>
                      <p className="text-sm text-gray-500">{anexo.tipo}</p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {anexo.storage_path ?? "Sem caminho salvo"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}