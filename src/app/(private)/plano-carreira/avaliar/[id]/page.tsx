// app/plano-carreira/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { SoftSkillsTable } from "@/components/plano-carreira/soft-skills"
import { HardEconoSkillsTable } from "@/components/plano-carreira/hard-skills-econo"
import { TextSubmit } from "@/components/text-submit"
import { useUserStore } from "@/stores/userStore"
import { roles } from "@/constants/roles"
import {
  submitSoftSkillsAssessment,
  submitHardSkillsEcono,
  submitHardSkillsMg,
  submitHardSkillsTI,
  submitHardSkillsContabeis,
  submitComment,
} from "@/app/actions/plano-carreira"
import { SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills"
import {
  getAllColaboradores,
  getDepartamentoByID,
} from "@/app/actions/colaboradores"
import { Colaborador } from "@/types/colaboradores"

import { habilidadesDetalhadas, opcoes } from "@/constants/soft-skills"
import { HardContabeisSkillsTable } from "@/components/plano-carreira/hard-skills-adm"
import { hardSkillsEcono } from "@/constants/hard-skills-econo"
import { hardSkillsAmbientais } from "@/constants/hard-skills-mg"
import { HardSkillsMgTable } from "@/components/plano-carreira/hard-skills-mg"
import { HardTISkillsTable } from "@/components/plano-carreira/hard-skills-ti"
import { useClientRole } from "@/hooks/use-client-role"
import { hardSkillsTI } from "@/constants/hard-skills-ti"
import { hardSkillsFinanceiro } from "@/constants/hard-skills-adm"
import {
  SelectTrigger,
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"

export default function AvaliacaoColaboradorPage() {
  const params = useParams()
  const colaboradorId = params.id as string | undefined

  const userId = useUserStore((s) => s.user?.id)
  const { role } = useClientRole()
  const isDiretor = role === roles.diretor || role === roles.gestor

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"soft" | "hard" | "feedback">(
    "soft",
  )
  const [semestre, setSemestre] = useState("")

  useEffect(() => {
    getAllColaboradores()
      .then(setColaboradores)
      .catch(() => setColaboradores([]))
      .finally(() => setLoading(false))
  }, [])

  // Always call hooks before any return
  const colaborador = colaboradores.find((c) => c.id === colaboradorId)
  const idDeptoAvaliado = colaborador?.departamentoId

  const { data: nomeDeptoAvaliado } = useQuery({
    queryKey: ["depto", idDeptoAvaliado],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1]
      if (!id) return null
      const departamento = await getDepartamentoByID(String(id))
      return departamento?.nome_departamento
    },
    enabled: !!idDeptoAvaliado,
  })
  console.log(nomeDeptoAvaliado)
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

  if (!colaborador) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Colaborador não encontrado.
      </div>
    )
  }

  // Handlers de envio
  const handleSubmitSoft = (res: SoftSkillsAssessmentType) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    submitSoftSkillsAssessment({ ...res, semestre }).then(() =>
      alert("Soft skills enviadas!"),
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitHardEcono = (res: any) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    submitHardSkillsEcono({ ...res, semestre })
      .then(() => alert("Hard skills enviadas!"))
      .catch((error) => {
        console.error("Erro ao enviar hard skills:", error)
        alert("Erro ao enviar hard skills. Por favor, tente novamente.")
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitHardAmbiental = (res: any) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    submitHardSkillsMg({ ...res, semestre })
      .then(() => alert("Hard skills ambientais enviadas!"))
      .catch((error) => {
        console.error("Erro ao enviar hard skills ambientais:", error)
        alert(
          "Erro ao enviar hard skills ambientais. Por favor, tente novamente.",
        )
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitHardTI = (res: any) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    submitHardSkillsTI({ ...res, semestre })
      .then(() => alert("Hard skills de TI enviadas!"))
      .catch((error) => {
        console.error("Erro ao enviar hard skills de TI:", error)
        alert("Erro ao enviar hard skills de TI. Por favor, tente novamente.")
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitHardAdm = (res: any) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    submitHardSkillsContabeis({ ...res, semestre })
      .then(() => alert("Hard skills administrativas enviadas!"))
      .catch((error) => {
        console.error("Erro ao enviar hard skills administrativas:", error)
        alert(
          "Erro ao enviar hard skills administrativas. Por favor, tente novamente.",
        )
      })
  }

  const handleGeneralCommentSubmit = (comment: string) => {
    if (!semestre) {
      alert("Por favor, selecione o semestre.")
      return
    }
    if (!colaboradorId) {
      alert("ID do colaborador não encontrado.")
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
        Avaliação de <span className="text-blue-700 ">{colaborador.nome}</span>
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="mb-6 w-full flex justify-center">
          <TabsTrigger value="soft">Soft Skills</TabsTrigger>
          <TabsTrigger value="hard">Hard Skills</TabsTrigger>
          <TabsTrigger value="feedback">
            Comentários e Encaminhamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soft">
          <div className="text-center text-gray-500">
            <SoftSkillsTable
              habilidadesDetalhadas={habilidadesDetalhadas}
              opcoes={opcoes}
              colaboradores={[colaborador]}
              evaluatorId={userId}
              onSubmit={handleSubmitSoft}
            />
          </div>
        </TabsContent>

        <TabsContent value="hard">
          <div className="text-center text-gray-500">
            {nomeDeptoAvaliado ===
            "Departamento de Meio Ambiente e Geoprocessamento" ? (
              <HardSkillsMgTable
                habilidadesDetalhadas={hardSkillsAmbientais}
                opcoes={opcoes}
                colaboradores={[colaborador]}
                evaluatorId={userId}
                onSubmit={handleSubmitHardAmbiental}
              />
            ) : nomeDeptoAvaliado ===
              "Departamento de Desenvolvimento de Software" ? (
              <HardTISkillsTable
                habilidadesDetalhadas={hardSkillsTI}
                opcoes={opcoes}
                colaboradores={[colaborador]}
                evaluatorId={userId}
                onSubmit={handleSubmitHardTI}
              />
            ) : nomeDeptoAvaliado === "Departamento Administrativo" ? (
              <HardContabeisSkillsTable
                habilidadesDetalhadas={hardSkillsFinanceiro}
                opcoes={opcoes}
                colaboradores={[colaborador]}
                evaluatorId={userId}
                onSubmit={handleSubmitHardAdm}
              />
            ) : (
              <HardEconoSkillsTable
                habilidadesDetalhadas={hardSkillsEcono}
                opcoes={opcoes}
                colaboradores={[colaborador]}
                evaluatorId={userId}
                onSubmit={handleSubmitHardEcono}
              />
            )}
          </div>
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
