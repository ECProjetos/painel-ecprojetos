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
import { ClipboardCheck, CheckCircle2, Lock, Send } from "lucide-react";
import { getFeedbackFormulariosAbertos } from "@/app/actions/feedback-interno";

type PageProps = {
  searchParams: Promise<{
    sucesso?: string;
  }>;
};

function formatConfidencialidade(value: string | null | undefined) {
  if (value === "anonimo") return "Anônimo";
  if (value === "identificado") return "Identificado";
  return "-";
}

export default async function FeedbackResponderPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const formularios = await getFeedbackFormulariosAbertos();

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
            <BreadcrumbPage>Responder</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Responder Feedbacks
            </h1>
          </div>

          <p className="text-sm text-gray-500">
            Formulários disponíveis para preenchimento no ciclo aberto.
          </p>
        </div>

        {params.sucesso === "1" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            Resposta enviada com sucesso.
          </div>
        )}

        {formularios.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum formulário aberto</CardTitle>
              <CardDescription>
                No momento não há formulários de feedback disponíveis para
                preenchimento.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {formularios.map((formulario) => (
              <Card key={formulario.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {formulario.titulo}
                    </CardTitle>

                    {formulario.respondido ? (
                      <Badge variant="secondary">Respondido</Badge>
                    ) : (
                      <Badge variant="default">Aberto</Badge>
                    )}
                  </div>

                  <CardDescription>
                    {formulario.feedback_ciclos?.[0]?.nome ?? "-"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col space-y-4">
                  <p className="text-sm text-gray-600">
                    {formulario.instrucoes}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {formatConfidencialidade(formulario.confidencialidade)}
                    </Badge>

                    <Badge variant="outline">
                      {formulario.total_perguntas} perguntas
                    </Badge>
                  </div>

                  {formulario.confidencialidade === "anonimo" && (
                    <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Este formulário é anônimo. Sua participação é registrada
                        apenas para evitar respostas duplicadas.
                      </p>
                    </div>
                  )}
                <div className="mt-auto">
                  {formulario.respondido ? (
                    <Button variant="outline" disabled className="w-full">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Já respondido
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={`/feedback-interno/responder/${formulario.id}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Responder
                      </Link>
                    </Button>
                  )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}