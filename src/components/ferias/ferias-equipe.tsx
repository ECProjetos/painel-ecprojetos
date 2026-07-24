"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ColaboradorEquipe = {
  id: string
  nome: string
  cargo: string | null
  equipe: string | null
}

type FeriasEquipeSolicitacao = {
  id: string
  colaborador_id: string
  colaborador_nome: string
  equipe: string | null
  cargo: string | null
  data_inicio: string
  data_fim: string
  dias_corridos: number
}

type CorColaborador = {
  solid: string
  soft: string
}

type FeriasEquipeProps = {
  lider: {
    id: string
    nome: string
  }
  equipes: string[]
  colaboradores: ColaboradorEquipe[]
  solicitacoes: FeriasEquipeSolicitacao[]
  resumo: {
    total: number
    emFeriasHoje: number
    proximas: number
    colaboradoresComFerias: number
  }
  filtros: {
    dataInicio: string
    dataFim: string
  }
}

export default function FeriasEquipe({
  lider,
  equipes,
  colaboradores,
  solicitacoes,
  resumo,
  filtros,
}: FeriasEquipeProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dataInicio, setDataInicio] = useState(filtros.dataInicio)
  const [dataFim, setDataFim] = useState(filtros.dataFim)

  useEffect(() => {
    setDataInicio(filtros.dataInicio)
    setDataFim(filtros.dataFim)
  }, [filtros.dataInicio, filtros.dataFim])

  const datasPeriodo = useMemo(
    () => gerarDatasPeriodo(filtros.dataInicio, filtros.dataFim),
    [filtros.dataInicio, filtros.dataFim],
  )

  const solicitacoesPorColaborador = useMemo(() => {
    const mapa = new Map<string, FeriasEquipeSolicitacao[]>()

    for (const solicitacao of solicitacoes) {
      const atuais = mapa.get(solicitacao.colaborador_id) ?? []
      atuais.push(solicitacao)
      mapa.set(solicitacao.colaborador_id, atuais)
    }

    return mapa
  }, [solicitacoes])

  const colaboradoresComSolicitacao = useMemo(() => {
    return colaboradores
      .filter((colaborador) => solicitacoesPorColaborador.has(colaborador.id))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [colaboradores, solicitacoesPorColaborador])

  const coresPorColaborador = useMemo(() => {
    return new Map(
      colaboradores.map((colaborador) => [
        colaborador.id,
        gerarCorColaborador(colaborador.id),
      ]),
    )
  }, [colaboradores])

  function aplicarPeriodo() {
    if (!dataInicio || !dataFim) return

    const inicio = dataInicio <= dataFim ? dataInicio : dataFim
    const fim = dataInicio <= dataFim ? dataFim : dataInicio

    startTransition(() => {
      router.push(
        `/rh/ferias-equipe?dataInicio=${encodeURIComponent(inicio)}&dataFim=${encodeURIComponent(fim)}`,
      )
    })
  }

  function limparPeriodo() {
    startTransition(() => {
      router.push("/rh/ferias-equipe")
    })
  }

  const descricaoPeriodo = `${formatarData(filtros.dataInicio)} a ${formatarData(
    filtros.dataFim,
  )}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Férias da Equipe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte somente as férias aprovadas dos colaboradores das suas
            equipes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {equipes.map((equipe) => (
              <Badge key={equipe} variant="secondary">
                {equipe}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="w-full lg:w-auto lg:min-w-[520px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Período</CardTitle>
            <CardDescription>
              Selecione a data inicial e a data final da consulta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lider-data-inicio">Data inicial</Label>
                <Input
                  id="lider-data-inicio"
                  type="date"
                  value={dataInicio}
                  max={dataFim || undefined}
                  onChange={(event) => setDataInicio(event.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lider-data-fim">Data final</Label>
                <Input
                  id="lider-data-fim"
                  type="date"
                  value={dataFim}
                  min={dataInicio || undefined}
                  onChange={(event) => setDataFim(event.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={limparPeriodo}
                disabled={isPending}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button
                type="button"
                onClick={aplicarPeriodo}
                disabled={isPending || !dataInicio || !dataFim}
              >
                <Search className="mr-2 h-4 w-4" />
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Colaboradores da equipe"
          valor={colaboradores.length}
          descricao="usuários ativos"
          icon={Users}
        />
        <ResumoCard
          titulo="Férias aprovadas"
          valor={resumo.total}
          descricao="no período selecionado"
          icon={CalendarCheck2}
        />
        <ResumoCard
          titulo="Em férias hoje"
          valor={resumo.emFeriasHoje}
          descricao="colaboradores ausentes"
          icon={Clock3}
        />
        <ResumoCard
          titulo="Com férias no período"
          valor={resumo.colaboradoresComFerias}
          descricao={`${resumo.proximas} período(s) futuro(s)`}
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendário da equipe</CardTitle>
          <CardDescription>
            Períodos aprovados entre {descricaoPeriodo}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {colaboradoresComSolicitacao.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <div
                className="min-w-max"
                style={{
                  display: "grid",
                  gridTemplateColumns: `240px repeat(${datasPeriodo.length}, minmax(30px, 30px))`,
                }}
              >
                <div className="sticky left-0 z-20 border-b border-r bg-muted/90 px-3 py-2 text-sm font-semibold backdrop-blur">
                  Colaborador
                </div>

                {datasPeriodo.map((data) => {
                  const dataLocal = parseDate(data)
                  const diaSemana = dataLocal.getDay()

                  return (
                    <div
                      key={`cabecalho-${data}`}
                      className={cn(
                        "border-b border-r px-0.5 py-2 text-center",
                        isFimDeSemana(data)
                          ? "bg-muted/80 text-muted-foreground"
                          : "bg-muted/40",
                        isSameDay(dataLocal, new Date()) && "bg-blue-50",
                      )}
                      title={formatarData(data)}
                    >
                      <div className="text-[9px] text-muted-foreground">
                        {diasSemana[diaSemana]}
                      </div>
                      <div className="text-xs font-semibold">
                        {String(dataLocal.getDate()).padStart(2, "0")}
                      </div>
                    </div>
                  )
                })}

                {colaboradoresComSolicitacao.map((colaborador) => {
                  const periodos =
                    solicitacoesPorColaborador.get(colaborador.id) ?? []

                  return (
                    <CalendarRow
                      key={colaborador.id}
                      colaborador={colaborador}
                      periodos={periodos}
                      datasPeriodo={datasPeriodo}
                      cor={
                        coresPorColaborador.get(colaborador.id) ??
                        gerarCorColaborador(colaborador.id)
                      }
                    />
                  )
                })}
              </div>
            </div>
          )}

          {colaboradoresComSolicitacao.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              As cores servem apenas para diferenciar os colaboradores no
              calendário. Todas as férias exibidas nesta tela já estão
              aprovadas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Períodos aprovados</CardTitle>
          <CardDescription>
            Relação completa das férias aprovadas que alcançam o período
            selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Nenhuma férias aprovada para o período selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        <div className="font-medium">
                          {solicitacao.colaborador_nome}
                        </div>
                        {solicitacao.cargo && (
                          <div className="text-xs text-muted-foreground">
                            {solicitacao.cargo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{solicitacao.equipe ?? "Sem equipe"}</TableCell>
                      <TableCell>{formatarData(solicitacao.data_inicio)}</TableCell>
                      <TableCell>{formatarData(solicitacao.data_fim)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {solicitacao.dias_corridos}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Visualização disponível para {lider.nome}. Solicitações pendentes,
        reprovadas, canceladas e informações administrativas não são exibidas.
      </p>
    </div>
  )
}

function ResumoCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string
  valor: number
  descricao: string
  icon: typeof Users
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium">{titulo}</p>
          <p className="mt-4 text-3xl font-semibold">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function CalendarRow({
  colaborador,
  periodos,
  datasPeriodo,
  cor,
}: {
  colaborador: ColaboradorEquipe
  periodos: FeriasEquipeSolicitacao[]
  datasPeriodo: string[]
  cor: CorColaborador
}) {
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-r bg-background px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: cor.solid }}
            aria-hidden="true"
          />
          <div className="truncate text-sm font-medium">{colaborador.nome}</div>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {colaborador.cargo ?? colaborador.equipe ?? "Colaborador"}
        </div>
      </div>

      {datasPeriodo.map((data) => {
        const periodo = periodos.find(
          (item) => item.data_inicio <= data && item.data_fim >= data,
        )

        return (
          <div
            key={`${colaborador.id}-${data}`}
            className={cn(
              "flex min-h-14 items-center justify-center border-b border-r p-0.5",
              isFimDeSemana(data) && "bg-muted/40",
              isSameDay(parseDate(data), new Date()) && "bg-blue-50/70",
            )}
            title={
              periodo
                ? `${colaborador.nome}: ${formatarData(periodo.data_inicio)} a ${formatarData(periodo.data_fim)}`
                : formatarData(data)
            }
          >
            {periodo && (
              <div
                className={cn(
                  "h-8 w-full",
                  data === periodo.data_inicio && "rounded-l-md",
                  data === periodo.data_fim && "rounded-r-md",
                )}
                style={{ backgroundColor: cor.solid }}
                aria-label={`Férias de ${colaborador.nome}`}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">Nenhuma férias aprovada no período</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        A página será atualizada quando o RH aprovar uma solicitação de alguém
        pertencente à equipe do líder.
      </p>
    </div>
  )
}

function gerarCorColaborador(chave: string): CorColaborador {
  const hash = hashTexto(chave)

  // Faixas azul, índigo, violeta, roxo e rosa.
  // Verde, amarelo, laranja e vermelho ficam reservados aos status.
  const faixas = [
    { inicio: 195, tamanho: 51 },
    { inicio: 250, tamanho: 46 },
    { inicio: 300, tamanho: 31 },
  ]

  const totalTons = faixas.reduce((total, faixa) => total + faixa.tamanho, 0)
  let posicao = hash % totalTons
  let hue = faixas[0].inicio

  for (const faixa of faixas) {
    if (posicao < faixa.tamanho) {
      hue = faixa.inicio + posicao
      break
    }

    posicao -= faixa.tamanho
  }

  const saturacao = 66 + ((hash >>> 8) % 12)
  const luminosidade = 45 + ((hash >>> 16) % 8)

  return {
    solid: `hsl(${hue} ${saturacao}% ${luminosidade}%)`,
    soft: `hsl(${hue} ${saturacao}% ${luminosidade}% / 0.16)`,
  }
}

function hashTexto(valor: string) {
  let hash = 2166136261

  for (let index = 0; index < valor.length; index += 1) {
    hash ^= valor.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"]

function gerarDatasPeriodo(dataInicio: string, dataFim: string) {
  const inicio = parseDate(dataInicio)
  const fim = parseDate(dataFim)

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return []

  const datas: string[] = []
  const atual = new Date(inicio)

  while (atual <= fim) {
    datas.push(formatarDataISO(atual))
    atual.setDate(atual.getDate() + 1)
  }

  return datas
}

function parseDate(value: string) {
  const [ano, mes, dia] = value.split("-").map(Number)
  return new Date(ano, mes - 1, dia, 12)
}

function formatarDataISO(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`
}

function isFimDeSemana(data: string) {
  const semana = parseDate(data).getDay()
  return semana === 0 || semana === 6
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}
