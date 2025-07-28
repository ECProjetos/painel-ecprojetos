"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "../ui/card"
import type { RelatorioRh as RelatorioRhType, RelatorioRh2 } from "@/types/inicio/relatorio-colaborador"
import { getHoursRh, getHoursRhByAttProj } from "@/app/actions/inicio/get-hours"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DistribuicaoItem = {
  nome: string
  horas: number
  percentual: number
}

export default function RelatorioRh() {
  const [loading, setLoading] = useState(true)
  const [distributionData, setDistributionData] = useState<RelatorioRhType>([])
  const [detailedData, setDetailedData] = useState<RelatorioRh2>([])

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const [rhResult, rhByAttProjResult] = await Promise.all([
          getHoursRh(),
          getHoursRhByAttProj(),
        ])

        if (rhResult && Array.isArray(rhResult)) {
          setDistributionData(rhResult)
        }

        if (rhByAttProjResult && Array.isArray(rhByAttProjResult)) {
          setDetailedData(rhByAttProjResult)
        }
      } catch (error) {
        console.error("Erro ao buscar dados do relatório RH:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const { distribuicaoProjetos, distribuicaoAtividades } = useMemo(() => {
    const projetos = distributionData.filter(
      (item) => item.tipo_agrupamento === "projeto",
    )
    const atividades = distributionData.filter(
      (item) => item.tipo_agrupamento === "atividade",
    )

    const totalProjetos = projetos.reduce(
      (acc, item) => acc + item.total_horas,
      0,
    )
    const totalAtividades = atividades.reduce(
      (acc, item) => acc + item.total_horas,
      0,
    )

    const distribuicaoProjetos: DistribuicaoItem[] = projetos.map((item) => ({
      nome: item.nome_agrupamento,
      horas: item.total_horas,
      percentual:
        totalProjetos > 0 ? (item.total_horas / totalProjetos) * 100 : 0,
    }))

    const distribuicaoAtividades: DistribuicaoItem[] = atividades.map(
      (item) => ({
        nome: item.nome_agrupamento,
        horas: item.total_horas,
        percentual:
          totalAtividades > 0
            ? (item.total_horas / totalAtividades) * 100
            : 0,
      }),
    )

    return { distribuicaoProjetos, distribuicaoAtividades }
  }, [distributionData])

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="p-4">
            <Skeleton className="mb-4 h-6 w-1/2" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-4 h-2 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </Card>
          <Card className="p-4">
            <Skeleton className="mb-4 h-6 w-1/2" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-4 h-2 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="p-4">
            <Skeleton className="mb-4 h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </Card>
          <Card className="p-4">
            <Skeleton className="mb-4 h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
        <Card className="p-4">
          <Skeleton className="mb-4 h-6 w-1/2" />
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-xl font-semibold">Relatórios</h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Distribuição por Projeto</h2>
          {distribuicaoProjetos.map((p, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>{p.nome}</span>
                <span className="text-blue-600">{p.horas.toFixed(1)}h</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${p.percentual}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {p.percentual.toFixed(1)}% do total
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Distribuição por Atividade</h2>
          {distribuicaoAtividades.map((a, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>{a.nome}</span>
                <span className="text-green-600">{a.horas.toFixed(1)}h</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${a.percentual}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {a.percentual.toFixed(1)}% do total
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Horas por Projeto e Atividade</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Horas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.projeto}</TableCell>
                  <TableCell>{item.atividade}</TableCell>
                  <TableCell className="font-medium">
                    {item.horas.toFixed(1)}h
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">
            Horas por Funcionário e Atividade
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Horas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedData.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.funcionario}</TableCell>
                  <TableCell>{item.atividade}</TableCell>
                  <TableCell className="font-medium">
                    {item.horas.toFixed(1)}h
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Relatório Geral Detalhado</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Horas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailedData.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.data}</TableCell>
                <TableCell>{item.funcionario}</TableCell>
                <TableCell>{item.periodo}</TableCell>
                <TableCell>{item.projeto}</TableCell>
                <TableCell>{item.atividade}</TableCell>
                <TableCell className="font-medium">
                  {item.horas.toFixed(1)}h
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
