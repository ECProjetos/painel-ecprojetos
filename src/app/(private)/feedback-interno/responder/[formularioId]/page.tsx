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
import { ArrowLeft, Lock } from "lucide-react";
import {
  getFeedbackFormularioParaResponder,
  responderFeedbackInterno,
} from "@/app/actions/feedback-interno";

type PageProps = {
  params: Promise<{
    formularioId: string;
  }>;
};

function renderCampoPergunta(pergunta: {
  id: string;
  ordem: number | null;
  pergunta: string | null;
  tipo_resposta: string | null;
}) {
  if (pergunta.tipo_resposta === "escala_1_5") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((nota) => (
          <label
            key={nota}
            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <input
              type="radio"
              name={`pergunta_${pergunta.id}`}
              value={nota}
              required
            />
            {nota}
          </label>
        ))}
      </div>
    );
  }

  if (pergunta.tipo_resposta === "escala_1_10") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nota) => (
          <label
            key={nota}
            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <input
              type="radio"
              name={`pergunta_${pergunta.id}`}
              value={nota}
              required
            />
            {nota}
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      name={`pergunta_${pergunta.id}`}
      required
      rows={4}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      placeholder="Digite sua resposta"
    />
  );
}

export default async function FeedbackFormularioResponderPage({
  params,
}: PageProps) {
  const { formularioId } = await params;

  const { formulario, jaRespondido, usuario } =
    await getFeedbackFormularioParaResponder(formularioId);

  const isAnonimo = formulario.confidencialidade === "anonimo";

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
              <BreadcrumbLink href="/feedback-interno/responder">
                Responder Feedbacks
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{formulario.titulo}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              {formulario.titulo}
            </h1>

            <p className="text-sm text-gray-500">
              {formulario.feedback_ciclos?.nome ?? "-"}
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/feedback-interno/responder">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        {jaRespondido ? (
          <Card>
            <CardHeader>
              <CardTitle>Formulário já respondido</CardTitle>
              <CardDescription>
                Você já enviou uma resposta para este formulário.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/feedback-interno/responder">Voltar</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form action={responderFeedbackInterno} className="space-y-4">
            <input type="hidden" name="formulario_id" value={formulario.id} />

            <Card>
              <CardHeader>
                <CardTitle>Informações iniciais</CardTitle>
                <CardDescription>
                  Preencha os dados necessários antes de responder.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {!isAnonimo && (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Nome
                      </label>
                      <input
                        name="nome"
                        defaultValue={usuario.nome ?? ""}
                        required
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Departamento
                    </label>
                    <input
                      name="departamento"
                      required
                      placeholder="Ex: Engenharia"
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {isAnonimo && (
                  <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Este formulário é anônimo. O sistema não salva seu nome nem
                      e-mail na resposta.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perguntas</CardTitle>
                <CardDescription>
                  Responda todas as perguntas abaixo para enviar o feedback.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {formulario.feedback_perguntas.map((pergunta) => (
                  <div
                    key={pergunta.id}
                    className="rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <Badge variant="secondary">{pergunta.ordem}</Badge>
                      <p className="font-medium text-gray-900">
                        {pergunta.pergunta}
                      </p>
                    </div>

                    {renderCampoPergunta(pergunta)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/feedback-interno/responder">Cancelar</Link>
              </Button>

              <Button type="submit">Enviar feedback</Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}