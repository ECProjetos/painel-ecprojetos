/* eslint-disable @typescript-eslint/no-explicit-any */

import ResumoCard from "./resumo-card"
import { useEffect, useState } from "react"
import { getUserSession } from "@/app/(auth)/actions"
import { getHoursById, getHoursProAct } from "@/app/actions/inicio/get-hours"
import Loading from "@/app/loading"
import {
  relatorioColaborador,
  relatorioColaboradorSchema,
} from "@/types/inicio/relatorio-colaborador"
import { horaProjeto } from "@/types/inicio/hora-projeto"
import { MinhasHorasPorProjeto } from "@/components/hora-projeto"

export default function RelatorioColaborador() {
  const [userId, setUserId] = useState<any>()
  const [hoursData, setHours] = useState<relatorioColaborador>()
  const [hourProject, setHourProject] = useState<horaProjeto>({
    projetos: [],
    atividades: [],
  })
  console.log(hourProject)

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getUserSession()
      setUserId(session?.user.id || null)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchHours = async () => {
      if (!userId) return
      const hoursData = await getHoursById(userId)
      if (hoursData && hoursData.data) {
        const parsedResult = relatorioColaboradorSchema.safeParse(
          hoursData.data,
        )
        if (parsedResult.success) {
          setHours(parsedResult.data)
        } else {
          setHours(undefined)
        }
      }
    }
    fetchHours()
  }, [userId])

  useEffect(() => {
    const fetchHoursProAct = async () => {
      if (!userId) return
      const hoursResult = await getHoursProAct(userId)
      if (hoursResult?.success && hoursResult.data) {
        setHourProject(hoursResult.data)
      } else {
        setHourProject({ projetos: [], atividades: [] })
      }
    }
    fetchHoursProAct()
  }, [userId])

  return userId ? (
    <div className="p-6 space-y-6">
      {/* 🔹 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <ResumoCard
          title="Total Trabalhado"
          value={
            hoursData?.actual_hours !== undefined
              ? `${hoursData.actual_hours.toFixed(1)} horas`
              : ""
          }
          gradient="from-blue-600 to-blue-500"
        />
        <ResumoCard
          title="Banco de Horas"
          value={
            hoursData?.banco_horas_atual !== undefined
              ? `${hoursData.banco_horas_atual.toFixed(1)} horas`
              : ""
          }
          gradient="from-green-600 to-green-500"
        />
        <ResumoCard
          title="Dias Trabalhados"
          value={
            hoursData?.business_days_passed !== undefined
              ? `${hoursData.business_days_passed}`
              : ""
          }
          gradient="from-purple-600 to-purple-500"
        />
      </div>

      {/* 🔹 Gráficos de Projeto e Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MinhasHorasPorProjeto
          dados={(hourProject.projetos ?? []).map((item) => ({
            ...item,
            user_id: userId,
            tipo_agrupamento: "projeto",
          }))}
          titulo="Minhas Horas por Projeto"
          cor="blue"
        />

        <MinhasHorasPorProjeto
          dados={(hourProject.atividades ?? []).map((item) => ({
            ...item,
            user_id: userId,
            tipo_agrupamento: "atividade",
          }))}
          titulo="Minhas Horas por Atividade"
          cor="green"
        />
      </div>
    </div>
  ) : (
    <Loading />
  )
}
