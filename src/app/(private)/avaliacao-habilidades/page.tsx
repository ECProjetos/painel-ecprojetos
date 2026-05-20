"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { TextSubmit } from "@/components/text-submit"
import { AvaliacaoHabilidadesForm } from "@/components/avaliacao-habilidades/avaliacao-habilidades-form"

import { useUserStore } from "@/stores/userStore"
import { useClientRole } from "@/hooks/use-client-role"
import { roles } from "@/constants/roles"

import { getAllColaboradores } from "@/app/actions/colaboradores"
import { submitComment } from "@/app/actions/plano-carreira"

function identificarDepartamentoQuestionario(nomeDepartamento?: string | null) {
  const nome = String(nomeDepartamento ?? "").toLowerCase()

  if (nome.includes("economia")) return "Economia"
  if (nome.includes("engenharia")) return "Engenharia"

  return null
}

export default function AvaliacaoColaboradorPage() {
  const params = useParams()
  const colaboradorId = params.id as string | undefined

  const userId = useUserStore((s) => s.user?.id)
  const { role } = useClientRole()
  const isDiretor = role === roles.diretor || role === roles.gestor

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"habilidades" | "feedback">(
    "habilidades",
  )
  const [semestre, setSemestre] = useState("")

  useEffect(() => {
    getAllColaboradores()
      .then(setColaboradores)
      .catch(() => setColaboradores([]))
      .finally(() => setLoading(false))
  }, [])

  const colaborador = colaboradores.find((c) => c.id === colaboradorId)

  const departamentoQuestionario = identificarDepartamentoQuestionario(
    colaborador?.nome_departamento,
  )

  if (!isDiretor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md border dark:bg-[#1c1c20] text-center">
          <h1 className="text-2xl font-semibold">
            Você não tem permissão para acessar esta página.
          </h1>
        </div>
      </div>
    )
  }

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando…
      </div>
    )
  }

  if (!colaborador || !colaboradorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Colaborador não encontrado.
      </div>
    )
  }

  const handleGeneralCommentSubmit = (comment: string) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }

    submitComment({ colaborador_id: colaboradorId, comment, semestre })
      .then(() => alert("Comentário enviado com sucesso!"))
      .catch((error) => {
        console.error("Erro ao enviar comentário:", error)
        alert("Erro ao enviar comentário. Por favor, tente novamente.")
      })
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
      <h1 className="text-3xl font-bold mb-4 text-center bg-blue-50 p-4 rounded-lg">
        Avaliação de <span className="text-blue-700">{colaborador.nome}</span>
      </h1>

      <Select onValueChange={setSemestre}>
        <SelectTrigger className="mb-4">
          <SelectValue placeholder="Semestre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Primeiro">Primeiro semestre</SelectItem>
          <SelectItem value="Segundo">Segundo semestre</SelectItem>
        </SelectContent>
      </Select>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "habilidades" | "feedback")}
        className="w-full"
      >
        <TabsList className="mb-6 w-full flex justify-center">
          <TabsTrigger value="habilidades">Avaliação de Habilidades</TabsTrigger>
          <TabsTrigger value="feedback">
            Comentários e Encaminhamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habilidades">
          {!semestre ? (
            <div className="rounded-xl border p-6 text-center text-gray-500">
              Selecione o semestre para iniciar a avaliação.
            </div>
          ) : !departamentoQuestionario ? (
            <div className="rounded-xl border p-6 text-center text-gray-500">
              Ainda não há questionário cadastrado para o departamento:{" "}
              <strong>{colaborador.nome_departamento ?? "Não informado"}</strong>
            </div>
          ) : (
            <AvaliacaoHabilidadesForm
              colaboradorId={colaboradorId}
              avaliadorId={userId}
              departamento={departamentoQuestionario}
              periodo={semestre}
            />
          )}
        </TabsContent>

        <TabsContent value="feedback">
          <div className="flex flex-col space-y-4">
            <TextSubmit onSubmit={handleGeneralCommentSubmit} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}