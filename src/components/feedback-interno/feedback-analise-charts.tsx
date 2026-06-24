"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

type LinhaAnalise = Record<string, any>

type FeedbackAnaliseChartsProps = {
  linhas: LinhaAnalise[]
}

function numero(valor: unknown) {
  const convertido = Number(valor)

  if (Number.isNaN(convertido)) {
    return 0
  }

  return convertido
}

function texto(valor: unknown, fallback = "-") {
  if (valor === null || valor === undefined || valor === "") {
    return fallback
  }

  return String(valor)
}

function getScore(item: LinhaAnalise) {
  return numero(
    item.media_executiva_100 ??
      item.media_atual_100 ??
      item.score_atual ??
      item.score_100 ??
      item.media_100 ??
      item.media,
  )
}

function getVariacao(item: LinhaAnalise) {
  return numero(
    item.variacao_media_100 ??
      item.variacao_100 ??
      item.variacao_score ??
      item.variacao,
  )
}

function getFormulario(item: LinhaAnalise) {
  return texto(
    item.formulario_titulo ??
      item.formulario ??
      item.tipo_feedback ??
      item.categoria,
    "Feedback",
  )
}

function getIndicador(item: LinhaAnalise) {
  return texto(
    item.pergunta ??
      item.pergunta_texto ??
      item.indicador ??
      item.titulo ??
      item.descricao,
    "Indicador",
  )
}

function montarScorePorTipo(linhas: LinhaAnalise[]) {
  const mapa = new Map<string, { nome: string; total: number; quantidade: number }>()

  for (const item of linhas) {
    const nome = getFormulario(item)
    const score = getScore(item)

    const atual = mapa.get(nome) ?? {
      nome,
      total: 0,
      quantidade: 0,
    }

    atual.total += score
    atual.quantidade += 1

    mapa.set(nome, atual)
  }

  return Array.from(mapa.values()).map((item) => ({
    nome: item.nome,
    score: item.quantidade > 0 ? Number((item.total / item.quantidade).toFixed(1)) : 0,
  }))
}

function montarTendencia(linhas: LinhaAnalise[]) {
  let melhoraram = 0
  let pioraram = 0
  let estaveis = 0

  for (const item of linhas) {
    const variacao = getVariacao(item)

    if (variacao > 0.5) {
      melhoraram += 1
    } else if (variacao < -0.5) {
      pioraram += 1
    } else {
      estaveis += 1
    }
  }

  return [
    {
      nome: "Melhoraram",
      quantidade: melhoraram,
    },
    {
      nome: "Estáveis",
      quantidade: estaveis,
    },
    {
      nome: "Pioraram",
      quantidade: pioraram,
    },
  ]
}

function montarTopCriticos(linhas: LinhaAnalise[]) {
  return [...linhas]
    .map((item) => ({
      nome: getIndicador(item),
      score: getScore(item),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      nomeCurto:
        item.nome.length > 38 ? `${item.nome.slice(0, 38)}...` : item.nome,
    }))
}

export function FeedbackAnaliseCharts({ linhas }: FeedbackAnaliseChartsProps) {
  const scorePorTipo = montarScorePorTipo(linhas)
  const tendencia = montarTendencia(linhas)
  const topCriticos = montarTopCriticos(linhas)

  if (!linhas || linhas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos da análise</CardTitle>
          <CardDescription>
            Nenhum dado disponível para gerar gráficos neste ciclo.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

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
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scorePorTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} />
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
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantidade" radius={[6, 6, 0, 0]} />
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
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCriticos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="nomeCurto"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {topCriticos.map((_, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}