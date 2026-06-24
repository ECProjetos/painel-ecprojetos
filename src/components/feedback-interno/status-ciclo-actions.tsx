"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { alterarStatusRespostasCicloFeedback } from "@/app/actions/feedback-interno"

type StatusRespostasFeedback = "fechado" | "aberto" | "encerrado"

type StatusCicloActionsProps = {
  cicloId: string
  statusRespostas?: string | null
}

function normalizarStatus(status?: string | null): StatusRespostasFeedback {
  if (status === "aberto") return "aberto"
  if (status === "encerrado") return "encerrado"
  return "fechado"
}

function getBadgeLabel(status: StatusRespostasFeedback) {
  if (status === "aberto") return "Aberto"
  if (status === "encerrado") return "Encerrado"
  return "Fechado"
}

function getBadgeVariant(status: StatusRespostasFeedback) {
  if (status === "aberto") return "default"
  if (status === "encerrado") return "secondary"
  return "outline"
}

export function StatusCicloActions({
  cicloId,
  statusRespostas,
}: StatusCicloActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statusAtual = normalizarStatus(statusRespostas)

  function alterarStatus(status: StatusRespostasFeedback) {
    startTransition(async () => {
      const resultado = await alterarStatusRespostasCicloFeedback(
        cicloId,
        status,
      )

      if (!resultado.success) {
        toast.error(resultado.message ?? "Erro ao atualizar ciclo.")
        return
      }

      toast.success(resultado.message)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant={getBadgeVariant(statusAtual)}>
        {getBadgeLabel(statusAtual)}
      </Badge>

      {statusAtual !== "aberto" && (
        <Button
          type="button"
          size="sm"
          onClick={() => alterarStatus("aberto")}
          disabled={isPending}
        >
          Abrir respostas
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

      {statusAtual === "encerrado" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => alterarStatus("aberto")}
          disabled={isPending}
        >
          Reabrir
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
