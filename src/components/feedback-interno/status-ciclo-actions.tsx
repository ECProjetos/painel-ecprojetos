"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { alterarStatusRespostasCicloFeedback } from "@/app/actions/feedback-interno"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type StatusRespostasFeedback = "fechado" | "aberto" | "encerrado"
type AcessoRespostasFeedback = "todos" | "diretores"

type StatusCicloActionsProps = {
  cicloId: string
  statusRespostas?: string | null
  acessoRespostas?: string | null
}

function normalizarStatus(status?: string | null): StatusRespostasFeedback {
  if (status === "aberto") return "aberto"
  if (status === "encerrado") return "encerrado"
  return "fechado"
}

function normalizarAcesso(
  acesso?: string | null,
): AcessoRespostasFeedback {
  return acesso === "diretores" ? "diretores" : "todos"
}

function getStatusLabel(status: StatusRespostasFeedback) {
  if (status === "aberto") return "Aberto"
  if (status === "encerrado") return "Encerrado"
  return "Fechado"
}

function getStatusVariant(status: StatusRespostasFeedback) {
  if (status === "aberto") return "default"
  if (status === "encerrado") return "secondary"
  return "outline"
}

function getAcessoLabel(acesso: AcessoRespostasFeedback) {
  return acesso === "diretores" ? "Somente diretores" : "Todos"
}

export function StatusCicloActions({
  cicloId,
  statusRespostas,
  acessoRespostas,
}: StatusCicloActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statusAtual = normalizarStatus(statusRespostas)
  const acessoAtual = normalizarAcesso(acessoRespostas)

  function alterarStatus(
    status: StatusRespostasFeedback,
    acesso: AcessoRespostasFeedback = acessoAtual,
  ) {
    startTransition(async () => {
      const resultado = await alterarStatusRespostasCicloFeedback(
        cicloId,
        status,
        acesso,
      )

      if (!resultado.success) {
        toast.error(resultado.message ?? "Erro ao atualizar ciclo.")
        return
      }

      toast.success(resultado.message)
      router.refresh()
    })
  }

  const textoAbrir = statusAtual === "encerrado" ? "Reabrir" : "Abrir"

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant={getStatusVariant(statusAtual)}>
        {getStatusLabel(statusAtual)}
      </Badge>

      <Badge variant="outline">{getAcessoLabel(acessoAtual)}</Badge>

      {statusAtual !== "aberto" && (
        <>
          <Button
            type="button"
            size="sm"
            onClick={() => alterarStatus("aberto", "diretores")}
            disabled={isPending}
          >
            {textoAbrir} só para diretores
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => alterarStatus("aberto", "todos")}
            disabled={isPending}
          >
            {textoAbrir} para todos
          </Button>
        </>
      )}

      {statusAtual === "aberto" && acessoAtual === "todos" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => alterarStatus("aberto", "diretores")}
          disabled={isPending}
        >
          Restringir aos diretores
        </Button>
      )}

      {statusAtual === "aberto" && acessoAtual === "diretores" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => alterarStatus("aberto", "todos")}
          disabled={isPending}
        >
          Liberar para todos
        </Button>
      )}

      {statusAtual === "aberto" && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => alterarStatus("encerrado")}
          disabled={isPending}
        >
          Encerrar
        </Button>
      )}

      {statusAtual !== "fechado" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => alterarStatus("fechado")}
          disabled={isPending}
        >
          Fechar
        </Button>
      )}
    </div>
  )
}
