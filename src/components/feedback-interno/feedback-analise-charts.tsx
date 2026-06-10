"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type LinhaAnaliseFeedback = {
  formulario_titulo: string | null
  categoria: string | null
  pergunta: string | null
  media_atual_100: number | string | null
  variacao_100: number | string | null
  tendencia: string | null
  prioridade: string | null
}

type FeedbackAnaliseChartsProps = {
  linhas: LinhaAnaliseFeedback[]
}

function formatCategoria(categoria: string | null | undefined) {
  const labels: Record<string, string> = {
    feedback_geral_empresa: "Feedback Geral",
    feedback_colaborador_gestor: "Colaborador para Gestor",
    feedback_tecnico_operacional: "Técnico e Operacional",
    feedback_gestor_colaborador: "Gestor para Colaborador",
  }

  return categoria ? labels[categoria] ?? categoria : "-"
}

function truncateText(value: string | null | undefined, max = 42) {
  if (!value) return "-"

  if (value.length <= max) return value

  return `${value.slice(0, max)}...`
}

function toNumber(value: number | string | null | undefined) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

export function FeedbackAnaliseCharts({ linhas }: FeedbackAnaliseChartsProps) {
  const resumoPorTipoMap = new Map<
    string,
    {
      tipo: string
      total: number
      somaScore: number
      somaVariacao: number
    }
  >()

  for (const item of linhas) {
    const tipo = formatCategoria(item.categoria)

    const atual = resumoPorTipoMap.get(tipo) ?? {
      tipo,
      total: 0,
      somaScore: 0,
      somaVariacao: 0,
    }

    atual.total += 1
    atual.somaScore += toNumber(item.media_atual_100)
    atual.somaVariacao += toNumber(item.variacao_100)

    resumoPorTipoMap.set(tipo, atual)
  }

  const resumoPorTipo = Array.from(resumoPorTipoMap.values()).map((item) => ({
    tipo: item.tipo,
    score: item.total > 0 ? Number((item.somaScore / item.total).toFixed(1)) : 0,
    variacao:
      item.total > 0 ? Number((item.somaVariacao / item.total).toFixed(1)) : 0,
  }))

  const tendencias = [
    {
      status: "Melhorou",
      total: linhas.filter((item) => item.tendencia === "Melhorou").length,
    },
    {
      status: "Estável",
      total: linhas.filter((item) => item.tendencia === "Estável").length,
    },
    {
      status: "Piorou",
      total: linhas.filter((item) => item.tendencia === "Piorou").length,
    },
  ]

  const pontosCriticos = [...linhas]
    .sort((a, b) => {
      const prioridadeA =
        a.prioridade === "Alta" ? 1 : a.prioridade === "Média" ? 2 : 3

      const prioridadeB =
        b.prioridade === "Alta" ? 1 : b.prioridade === "Média" ? 2 : 3

      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB

      return toNumber(a.media_atual_100) - toNumber(b.media_atual_100)
    })
    .slice(0, 5)
    .map((item) => ({
      pergunta: truncateText(item.pergunta, 46),
      score: Number(toNumber(item.media_atual_100).toFixed(1)),
      tipo: formatCategoria(item.categoria),
    }))

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Score por tipo de feedback</CardTitle>
          <CardDescription>
            Média normalizada de 0 a 100 no ciclo analisado.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumoPorTipo}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="tipo"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="score" position="top" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendência dos indicadores</CardTitle>
          <CardDescription>
            Quantidade de perguntas que melhoraram, pioraram ou ficaram estáveis.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tendencias}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total" position="top" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 pontos críticos</CardTitle>
          <CardDescription>
            Indicadores com menor score e maior prioridade de ação.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pontosCriticos}
                layout="vertical"
                margin={{ left: 16, right: 24 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="pergunta"
                  tickLine={false}
                  axisLine={false}
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="score" position="right" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}