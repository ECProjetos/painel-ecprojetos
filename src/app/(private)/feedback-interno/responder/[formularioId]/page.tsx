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
import { ArrowLeft, Lock } from "lucide-react"
import {
  getFeedbackFormularioParaResponder,
  responderFeedbackInterno,
  verificarDisponibilidadeFormularioFeedback,
} from "@/app/actions/feedback-interno"

type PageProps = {
  params: Promise<{
    formularioId: string
  }>
}

function renderCampoPergunta(pergunta: {
  id: string
  ordem: number | null
  pergunta: string | null
  tipo_resposta: string | null
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
    )
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
    )
  }

  return (
    <textarea
      name={`pergunta_${pergunta.id}`}
      required
      rows={4}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      placeholder="Digite sua resposta"
    />
  )
}

function separarPerguntaEDescricao(texto: string | null) {
  const textoLimpo = (texto ?? "").trim()

  if (textoLimpo.includes("\n\n")) {
    const [titulo, ...descricaoPartes] = textoLimpo.split("\n\n")

    return {
      titulo: titulo.trim(),
      descricao: descricaoPartes.join("\n\n").trim(),
    }
  }

  const inicioDescricao = textoLimpo.indexOf("1 =")

  if (inicioDescricao > -1) {
    return {
      titulo: textoLimpo.slice(0, inicioDescricao).trim(),
      descricao: textoLimpo.slice(inicioDescricao).trim(),
    }
  }

  return {
    titulo: textoLimpo,
    descricao: "",
  }
}

export default async function FeedbackFormularioResponderPage({
  params,
}: PageProps) {
  const { formularioId } = await params

  const disponibilidade =
    await verificarDisponibilidadeFormularioFeedback(formularioId)

  if (!disponibilidade.aberto) {
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

        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
          <div className="w-full rounded-xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900">
              Formulário indisponível
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {disponibilidade.motivo ??
                "Este formulário de feedback não está disponível para resposta no momento."}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              Aguarde a liberação pelo RH ou gestor responsável.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { formulario, jaRespondido, usuario, colaboradores } =
    await getFeedbackFormularioParaResponder(formularioId)

  const isAnonimo = formulario.confidencialidade === "anonimo"
  const isGestorColaborador =
    formulario.categoria === "feedback_gestor_colaborador"
  const possuiColaboradoresPendentes = colaboradores.some(
    (colaborador) => !colaborador.ja_avaliado,
  )

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
              {formulario.feedback_ciclos?.[0]?.nome ?? "-"}
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

                  {isGestorColaborador ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Colaborador avaliado
                      </label>
                      <select
                        name="avaliado_user_id"
                        required
                        defaultValue=""
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Selecione o colaborador
                        </option>
                        {colaboradores.map((colaborador) => (
                          <option
                            key={colaborador.id}
                            value={colaborador.id}
                            disabled={colaborador.ja_avaliado}
                          >
                            {colaborador.nome}
                            {colaborador.departamento
                              ? ` — ${colaborador.departamento}`
                              : ""}
                            {colaborador.ja_avaliado ? " (já avaliado)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
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
                  )}
                </div>

                {isGestorColaborador && !possuiColaboradoresPendentes && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Todos os colaboradores ativos já foram avaliados por você
                    neste ciclo.
                  </div>
                )}

                {isAnonimo && (
                  <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Este formulário é anônimo. O sistema não salva seu nome
                      nem e-mail na resposta.
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
                {formulario.feedback_perguntas.map((pergunta) => {
                  const { titulo, descricao } = separarPerguntaEDescricao(
                    pergunta.pergunta,
                  )

                  return (
                    <div
                      key={pergunta.id}
                      className="rounded-lg border bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          {pergunta.ordem}
                        </Badge>

                        <div className="space-y-1">
                          <p className="font-medium leading-relaxed text-gray-900">
                            {titulo}
                          </p>

                          {descricao ? (
                            <p className="text-sm font-normal leading-relaxed text-gray-500">
                              {descricao}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {renderCampoPergunta(pergunta)}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/feedback-interno/responder">Cancelar</Link>
              </Button>

              <Button
                type="submit"
                disabled={isGestorColaborador && !possuiColaboradoresPendentes}
              >
                Enviar feedback
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}