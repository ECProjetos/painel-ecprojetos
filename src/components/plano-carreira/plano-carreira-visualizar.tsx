"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  Eye,
  Loader2,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import {
  getPlanoCarreiraVisualizarBaseData,
  getPlanoCarreiraVisualizarDetalhe,
  type PlanoCarreiraVisualizarAnswer,
  type PlanoCarreiraVisualizarBaseData,
  type PlanoCarreiraVisualizarDetalhe,
  type PlanoCarreiraVisualizarSummary,
} from "@/app/actions/plano-carreira/get-plano-carreira-visualizar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type StatusKey = "rascunho" | "em_andamento" | "finalizada"

const STATUS_LABEL: Record<StatusKey, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
}

const STATUS_STYLE: Record<StatusKey, string> = {
  rascunho: "border-gray-200 bg-gray-50 text-gray-700",
  em_andamento: "border-amber-200 bg-amber-50 text-amber-700",
  finalizada: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

const GROUP_COLORS: Record<string, string> = {
  hard_skill: "#2563eb",
  soft_skill: "#16a34a",
  curso: "#9333ea",
  meta: "#ea580c",
  outro: "#64748b",
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatNumber(value: number | null | undefined, decimals = 1) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "-"
  }

  return Number(value).toFixed(decimals).replace(".", ",")
}

function formatDate(value?: string | null) {
  if (!value) return "-"

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("pt-BR")
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function getStatusKey(status?: string | null): StatusKey {
  const normalized = String(status ?? "").toLowerCase()

  if (normalized === "finalizada") return "finalizada"
  if (normalized === "em_andamento") return "em_andamento"

  return "rascunho"
}

function getGroupLabel(tipo: string) {
  if (tipo === "hard_skill") return "Hard skills"
  if (tipo === "soft_skill") return "Soft skills"
  if (tipo === "curso") return "Cursos"
  if (tipo === "meta") return "Metas"

  return tipo
}

function getGapLabel(value: number | null) {
  if (value === null) return "-"

  if (value > 0) {
    return `Colaborador +${formatNumber(value)}`
  }

  if (value < 0) {
    return `Gestor +${formatNumber(Math.abs(value))}`
  }

  return "Sem diferença"
}

function getPriorityStyle(value?: string | null) {
  const normalized = String(value ?? "").toLowerCase()

  if (normalized === "alta") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (normalized === "media") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (normalized === "baixa") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-gray-200 bg-gray-50 text-gray-600"
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        {action}
      </div>

      {children}
    </Card>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-5 text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-gray-50 p-3 text-gray-600">{icon}</div>
      </div>
    </Card>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {children}
    </label>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="text-sm text-gray-600">
          {item.name}: {formatNumber(item.value)}
        </p>
      ))}
    </div>
  )
}

function getGroupAverages(answers: PlanoCarreiraVisualizarAnswer[]) {
  const groups = new Map<
    string,
    {
      grupo_nome: string
      grupo_tipo: string
      notas: number[]
      metas: number[]
    }
  >()

  for (const answer of answers) {
    const key = answer.grupo_id || answer.grupo_nome

    const current = groups.get(key) ?? {
      grupo_nome: answer.grupo_nome,
      grupo_tipo: answer.grupo_tipo,
      notas: [],
      metas: [],
    }

    if (answer.nota_media !== null) {
      current.notas.push(answer.nota_media)
    }

    if (answer.meta_nota !== null) {
      current.metas.push(answer.meta_nota)
    }

    groups.set(key, current)
  }

  return Array.from(groups.values()).map((group) => {
    const mediaAtual = group.notas.length
      ? group.notas.reduce((acc, value) => acc + value, 0) / group.notas.length
      : 0

    const mediaMeta = group.metas.length
      ? group.metas.reduce((acc, value) => acc + value, 0) / group.metas.length
      : 0

    return {
      grupo: getGroupLabel(group.grupo_tipo),
      grupo_nome: group.grupo_nome,
      grupo_tipo: group.grupo_tipo,
      media_atual: Number(mediaAtual.toFixed(2)),
      media_meta: Number(mediaMeta.toFixed(2)),
      fill: GROUP_COLORS[group.grupo_tipo] ?? GROUP_COLORS.outro,
    }
  })
}

export default function PlanoCarreiraVisualizar() {
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [baseData, setBaseData] =
    useState<PlanoCarreiraVisualizarBaseData | null>(null)

  const [detailData, setDetailData] =
    useState<PlanoCarreiraVisualizarDetalhe | null>(null)

  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [selectedColaboradorId, setSelectedColaboradorId] = useState("")
  const [search, setSearch] = useState("")

  async function carregarBase() {
    try {
      setLoadingBase(true)

      const result = await getPlanoCarreiraVisualizarBaseData()

      if (!result.success || !result.data) {
        throw new Error(result.message)
      }

      setBaseData(result.data)

      const cicloAtivo =
        result.data.cycles.find((cycle) => cycle.status === "ativo") ??
        result.data.cycles[0]

      if (cicloAtivo) {
        setSelectedCycleId(cicloAtivo.id)
      }

      if (!result.data.canManage && result.data.colaboradores[0]) {
        setSelectedColaboradorId(result.data.colaboradores[0].id)
      }
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a visualização do Plano de Carreira.",
      )
    } finally {
      setLoadingBase(false)
    }
  }

  useEffect(() => {
    carregarBase()
  }, [])

  const summaries = baseData?.summaries ?? []
  const colaboradores = baseData?.colaboradores ?? []

  const filteredSummaries = useMemo(() => {
    const termo = normalizeSearch(search)

    return summaries.filter((summary) => {
      const matchCycle =
        !selectedCycleId || summary.cycle_id === selectedCycleId

      const matchColaborador =
        !selectedColaboradorId ||
        summary.colaborador_id === selectedColaboradorId

      const searchableText = normalizeSearch(
        [
          summary.colaborador_nome,
          summary.departamento_nome,
          summary.gestor_nome,
          summary.status,
          summary.ciclo_nome,
        ].join(" "),
      )

      return (
        matchCycle &&
        matchColaborador &&
        (!termo || searchableText.includes(termo))
      )
    })
  }, [summaries, selectedCycleId, selectedColaboradorId, search])

  const selectedSummary = detailData?.summary ?? null
  const answers = detailData?.answers ?? []

  const groupAverages = useMemo(() => getGroupAverages(answers), [answers])

  const hardSkills = useMemo(
    () => answers.filter((item) => item.grupo_tipo === "hard_skill"),
    [answers],
  )

  const softSkills = useMemo(
    () => answers.filter((item) => item.grupo_tipo === "soft_skill"),
    [answers],
  )

  const desenvolvimento = useMemo(() => {
    return [...answers]
      .filter((item) => item.gap_meta_atual !== null)
      .sort(
        (a, b) =>
          toFiniteNumber(b.gap_meta_atual) - toFiniteNumber(a.gap_meta_atual),
      )
      .slice(0, 8)
  }, [answers])

  const maioresNotas = useMemo(() => {
    return [...answers]
      .filter((item) => item.nota_media !== null)
      .sort(
        (a, b) => toFiniteNumber(b.nota_media) - toFiniteNumber(a.nota_media),
      )
      .slice(0, 8)
  }, [answers])

  const rankingAreas = useMemo(() => {
    return [...answers]
      .filter((item) => item.ranking_area !== null && item.area_conhecimento)
      .sort((a, b) => {
        if (a.grupo_tipo !== b.grupo_tipo) {
          if (a.grupo_tipo === "hard_skill") return -1
          if (b.grupo_tipo === "hard_skill") return 1
          return a.grupo_tipo.localeCompare(b.grupo_tipo)
        }

        return toFiniteNumber(a.ranking_area) - toFiniteNumber(b.ranking_area)
      })
  }, [answers])

  const maioresGaps = useMemo(() => {
    return [...answers]
      .filter((item) => item.gap_colaborador_gestor !== null)
      .sort(
        (a, b) =>
          Math.abs(toFiniteNumber(b.gap_colaborador_gestor)) -
          Math.abs(toFiniteNumber(a.gap_colaborador_gestor)),
      )
      .slice(0, 8)
  }, [answers])

  async function carregarDetalhe(summary: PlanoCarreiraVisualizarSummary) {
    try {
      setLoadingDetail(true)

      const result = await getPlanoCarreiraVisualizarDetalhe({
        cycleId: summary.cycle_id,
        colaboradorId: summary.colaborador_id,
      })

      if (!result.success || !result.data) {
        throw new Error(result.message)
      }

      setDetailData(result.data)
      setSelectedCycleId(summary.cycle_id)
      setSelectedColaboradorId(summary.colaborador_id)

      toast.success("Plano de carreira carregado.")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o detalhe da avaliação.",
      )
    } finally {
      setLoadingDetail(false)
    }
  }

  async function carregarSelecionado() {
    if (!selectedCycleId || !selectedColaboradorId) {
      toast.error("Selecione o ciclo e o colaborador.")
      return
    }

    const summary = summaries.find(
      (item) =>
        item.cycle_id === selectedCycleId &&
        item.colaborador_id === selectedColaboradorId,
    )

    if (!summary) {
      toast.error("Nenhuma avaliação encontrada para esse filtro.")
      setDetailData(null)
      return
    }

    await carregarDetalhe(summary)
  }

  if (loadingBase) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando visualização do Plano de Carreira...
        </div>
      </div>
    )
  }

  if (!baseData) {
    return (
      <Card className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-1 h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800">
              Não foi possível carregar o Plano de Carreira.
            </h2>
            <p className="mt-1 text-sm text-red-700">
              Atualize a página ou tente novamente mais tarde.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Plano de Carreira
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {baseData.canManage 
              ? "Visualização das Avaliações"
              : "Meu Plano de Carreira"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {baseData.canManage 
              ? "Acompanhe médias, evolução, gaps, metas e pontos de desenvolvimento por colaborador."
              : "Acompanhe suas notas, metas, pontos fortes e pontos de desenvolvimento."}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Perfil atual: {baseData?.currentUserRole ?? "-"}
          </div>
        </div>
      </Card>

      <SectionCard
        title="Filtros"
        subtitle="Filtre por ciclo, colaborador ou busque por nome, departamento, gestor e status."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_1fr_180px]">
          <div className="flex flex-col gap-2">
            <FieldLabel>Ciclo</FieldLabel>
            <select
              value={selectedCycleId}
              onChange={(event) => {
                setSelectedCycleId(event.target.value)
                setDetailData(null)
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">Todos</option>
              {(baseData.cycles ?? []).map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.nome}
                </option>
              ))}
            </select>
          </div>

          {baseData.canManage ? (
            <div className="flex flex-col gap-2">
              <FieldLabel>Colaborador</FieldLabel>
              <select
                value={selectedColaboradorId}
                onChange={(event) => {
                  setSelectedColaboradorId(event.target.value)
                  setDetailData(null)
                }}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                    {colaborador.departamento_nome
                      ? ` | ${colaborador.departamento_nome}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <FieldLabel>Colaborador</FieldLabel>
              <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                {colaboradores[0]?.nome ?? "Meu Plano de Carreira"}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <FieldLabel>Buscar</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar na lista"
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={carregarSelecionado}
              disabled={
                !selectedCycleId || !selectedColaboradorId || loadingDetail
              }
              className="h-10 w-full"
            >
              {loadingDetail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Visualizar
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Avaliações encontradas"
        subtitle="Clique em uma avaliação para visualizar os detalhes."
      >
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Ciclo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Média colaborador</th>
                <th className="px-4 py-3">Média gestor</th>
                <th className="px-4 py-3">Média final</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredSummaries.length ? (
                filteredSummaries.map((summary) => {
                  const statusKey = getStatusKey(summary.status)

                  return (
                    <tr key={summary.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {summary.colaborador_nome}
                        {summary.gestor_nome ? (
                          <p className="mt-1 text-xs font-normal text-gray-500">
                            Gestor: {summary.gestor_nome}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {summary.departamento_nome}
                      </td>

                      <td className="px-4 py-3">
                        {summary.ano}.{summary.semestre}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_STYLE[statusKey]}`}
                        >
                          {STATUS_LABEL[statusKey]}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {formatNumber(summary.media_colaborador)}
                      </td>

                      <td className="px-4 py-3">
                        {formatNumber(summary.media_gestor)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatNumber(summary.media_geral)}
                      </td>

                      <td className="px-4 py-3">
                        {summary.total_itens_avaliados}
                      </td>

                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => carregarDetalhe(summary)}
                          disabled={loadingDetail}
                        >
                          {loadingDetail &&
                          selectedSummary?.id === summary.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          Ver
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Nenhuma avaliação encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selectedSummary ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              title="Média final"
              value={formatNumber(selectedSummary.media_geral)}
              subtitle="Média entre colaborador e gestor"
              icon={<Target className="h-5 w-5" />}
            />

            <KpiCard
              title="Média colaborador"
              value={formatNumber(selectedSummary.media_colaborador)}
              subtitle="Autoavaliação do colaborador"
              icon={<UserRound className="h-5 w-5" />}
            />

            <KpiCard
              title="Média gestor"
              value={formatNumber(selectedSummary.media_gestor)}
              subtitle="Avaliação do gestor"
              icon={<Eye className="h-5 w-5" />}
            />

            <KpiCard
              title="Hard skills"
              value={String(hardSkills.length)}
              subtitle="Habilidades técnicas avaliadas"
              icon={<BarChart3 className="h-5 w-5" />}
            />

            <KpiCard
              title="Soft skills"
              value={String(softSkills.length)}
              subtitle="Habilidades comportamentais avaliadas"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <SectionCard
            title="Ranking de áreas de conhecimento"
            subtitle="Áreas priorizadas conforme o modelo de avaliação do Plano de Carreira."
          >
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
              {[
                {
                  tipo: "hard_skill",
                  titulo: "Hard skills",
                  descricao: "Ranking das áreas técnicas priorizadas.",
                },
                {
                  tipo: "soft_skill",
                  titulo: "Soft skills",
                  descricao:
                    "Ranking das competências comportamentais priorizadas.",
                },
              ].map((grupoRanking) => {
                const items = rankingAreas.filter(
                  (item) => item.grupo_tipo === grupoRanking.tipo,
                )

                return (
                  <div
                    key={grupoRanking.tipo}
                    className="rounded-2xl border border-gray-100 bg-white p-4"
                  >
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        {grupoRanking.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {grupoRanking.descricao}
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="min-w-[640px] w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Ranking</th>
                            <th className="px-4 py-3">Área de conhecimento</th>
                            <th className="px-4 py-3">Nota atual</th>
                            <th className="px-4 py-3">Meta</th>
                            <th className="px-4 py-3">Gap</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {items.length ? (
                            items.map((item) => (
                              <tr
                                key={`${item.grupo_tipo}-${item.ranking_area}-${item.id}`}
                              >
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                  {item.ranking_area}
                                </td>

                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {item.area_conhecimento ?? item.skill_nome}
                                </td>

                                <td className="px-4 py-3">
                                  {formatNumber(item.nota_media)}
                                </td>

                                <td className="px-4 py-3">
                                  {formatNumber(item.meta_nota)}
                                </td>

                                <td className="px-4 py-3">
                                  {formatNumber(item.gap_meta_atual)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                Nenhum ranking cadastrado para{" "}
                                {grupoRanking.titulo}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <SectionCard
              title="Média por grupo"
              subtitle="Comparação entre média atual e meta cadastrada."
            >
              {groupAverages.length ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grupo" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="media_atual"
                        name="Média atual"
                        radius={[8, 8, 0, 0]}
                      >
                        {groupAverages.map((item) => (
                          <Cell key={item.grupo_nome} fill={item.fill} />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="media_meta"
                        name="Meta média"
                        fill="#94a3b8"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                  Nenhum grupo com notas encontrado.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Pontos de desenvolvimento"
              subtitle="Maiores diferenças entre a meta e a nota atual."
            >
              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
                {desenvolvimento.length ? (
                  desenvolvimento.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.skill_nome}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {getGroupLabel(item.grupo_tipo)} | Meta:{" "}
                            {formatNumber(item.meta_nota)} | Atual:{" "}
                            {formatNumber(item.nota_media)}
                          </p>
                        </div>

                        <span className="rounded-full border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Gap {formatNumber(item.gap_meta_atual)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                    Nenhum gap de meta encontrado.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <SectionCard
              title="Maiores fortalezas"
              subtitle="Habilidades com maiores notas médias."
            >
              <div className="space-y-3">
                {maioresNotas.length ? (
                  maioresNotas.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.skill_nome}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {getGroupLabel(item.grupo_tipo)}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          {formatNumber(item.nota_media)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                    Nenhuma nota encontrada.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Diferenças de percepção"
              subtitle="Maiores gaps entre a nota do colaborador e a nota do gestor."
            >
              <div className="space-y-3">
                {maioresGaps.length ? (
                  maioresGaps.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.skill_nome}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Colaborador: {formatNumber(item.nota_colaborador)} |
                            Gestor: {formatNumber(item.nota_gestor)}
                          </p>
                        </div>

                        <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          {getGapLabel(item.gap_colaborador_gestor)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                    Nenhum gap entre colaborador e gestor encontrado.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Detalhamento das habilidades"
            subtitle="Tabela completa com notas, metas, prioridades e comentários."
          >
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Grupo</th>
                    <th className="px-4 py-3">Habilidade</th>
                    <th className="px-4 py-3">Nota colaborador</th>
                    <th className="px-4 py-3">Nota gestor</th>
                    <th className="px-4 py-3">Nota final</th>
                    <th className="px-4 py-3">Meta</th>
                    <th className="px-4 py-3">Gap meta</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Prazo</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {answers.length ? (
                    answers.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {getGroupLabel(item.grupo_tipo)}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.skill_nome}
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(item.nota_colaborador)}
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(item.nota_gestor)}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {formatNumber(item.nota_media)}
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(item.meta_nota)}
                        </td>

                        <td className="px-4 py-3">
                          {formatNumber(item.gap_meta_atual)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getPriorityStyle(
                              item.prioridade,
                            )}`}
                          >
                            {item.prioridade ?? "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3">{item.prazo_meta ?? "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma habilidade encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Comentários e plano de ação"
            subtitle="Observações finais registradas na avaliação."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Observações do colaborador
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {detailData?.observacoes_colaborador ?? "Não informado."}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Observações do gestor
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {detailData?.observacoes_gestor ?? "Não informado."}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Plano de ação
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {detailData?.plano_acao ?? "Não informado."}
                </p>
              </div>
            </div>
          </SectionCard>
        </>
      ) : (
        <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm text-gray-600">
            Selecione uma avaliação na lista ou escolha um ciclo e colaborador
            para visualizar o detalhe do Plano de Carreira.
          </p>
        </Card>
      )}
    </div>
  )
}
