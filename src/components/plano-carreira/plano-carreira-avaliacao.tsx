"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Save,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import {
  getPlanoCarreiraAvaliacaoData,
  getQuestionarioPlanoCarreira,
  salvarAvaliacaoPlanoCarreira,
  type PlanoCarreiraAvaliacaoData,
  type PlanoCarreiraAnswerInput,
  type PlanoCarreiraQuestionarioData,
  type PlanoCarreiraSkillItem,
} from "@/app/actions/plano-carreira/get-plano-carreira-avaliacao"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type AnswerState = Record<string, PlanoCarreiraAnswerInput>

function toNumberOrNull(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null

  const numberValue = Number(String(value).replace(",", "."))

  return Number.isFinite(numberValue) ? numberValue : null
}

function formatNumber(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "-"
  }

  return Number(value).toFixed(1).replace(".", ",")
}

function getNotaMedia(answer?: PlanoCarreiraAnswerInput | null) {
  if (!answer) return null

  const notaColaborador = toNumberOrNull(answer.nota_colaborador)
  const notaGestor = toNumberOrNull(answer.nota_gestor)

  if (notaColaborador !== null && notaGestor !== null) {
    return Number(((notaColaborador + notaGestor) / 2).toFixed(1))
  }

  if (notaColaborador !== null) return notaColaborador
  if (notaGestor !== null) return notaGestor

  return null
}

function getMediaGeral(answers: AnswerState) {
  const medias = Object.values(answers)
    .map(getNotaMedia)
    .filter((value): value is number => value !== null)

  if (!medias.length) return null

  const soma = medias.reduce((acc, value) => acc + value, 0)

  return Number((soma / medias.length).toFixed(2))
}

function getMediaCampo(
  answers: AnswerState,
  campo: "nota_colaborador" | "nota_gestor",
) {
  const notas = Object.values(answers)
    .map((answer) => toNumberOrNull(answer[campo]))
    .filter((value): value is number => value !== null)

  if (!notas.length) return null

  const soma = notas.reduce((acc, value) => acc + value, 0)

  return Number((soma / notas.length).toFixed(2))
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>

      {children}
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

function NotaSelect({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
    >
      <option value="">-</option>
      <option value="1">1</option>
      <option value="1.5">1,5</option>
      <option value="2">2</option>
      <option value="2.5">2,5</option>
      <option value="3">3</option>
      <option value="3.5">3,5</option>
      <option value="4">4</option>
      <option value="4.5">4,5</option>
      <option value="5">5</option>
    </select>
  )
}

function RubricaBox({ item }: { item: PlanoCarreiraSkillItem }) {
  const rubricas = [
    {
      nivel: "1",
      label: "Muito abaixo do esperado",
      texto: item.rubrica_nivel_1,
    },
    { nivel: "2", label: "Abaixo do esperado", texto: item.rubrica_nivel_2 },
    { nivel: "3", label: "Dentro do esperado", texto: item.rubrica_nivel_3 },
    { nivel: "4", label: "Acima do esperado", texto: item.rubrica_nivel_4 },
    { nivel: "5", label: "Excelente", texto: item.rubrica_nivel_5 },
  ]

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
      {rubricas.map((rubrica) => (
        <div
          key={`${item.id}-${rubrica.nivel}`}
          className="rounded-xl border border-gray-100 bg-gray-50 p-3"
        >
          <p className="text-xs font-semibold text-gray-900">
            {rubrica.nivel} - {rubrica.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            {rubrica.texto || "Sem descrição cadastrada."}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function PlanoCarreiraAvaliacao() {
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingQuestionario, setLoadingQuestionario] = useState(false)
  const [saving, setSaving] = useState(false)

  const [baseData, setBaseData] = useState<PlanoCarreiraAvaliacaoData | null>(
    null,
  )
  const [questionarioData, setQuestionarioData] =
    useState<PlanoCarreiraQuestionarioData | null>(null)

  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [selectedColaboradorId, setSelectedColaboradorId] = useState("")

  const [searchColaborador, setSearchColaborador] = useState("")
  const [answers, setAnswers] = useState<AnswerState>({})

  const [observacoesColaborador, setObservacoesColaborador] = useState("")
  const [observacoesGestor, setObservacoesGestor] = useState("")
  const [planoAcao, setPlanoAcao] = useState("")

  async function carregarBase() {
    try {
      setLoadingInitial(true)

      const result = await getPlanoCarreiraAvaliacaoData()

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
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Plano de Carreira.",
      )
    } finally {
      setLoadingInitial(false)
    }
  }

  useEffect(() => {
    carregarBase()
  }, [])

  const colaboradoresFiltrados = useMemo(() => {
    const termo = searchColaborador
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    return (baseData?.colaboradores ?? []).filter((colaborador) => {
      const texto = [
        colaborador.nome,
        colaborador.email,
        colaborador.cargo_nome,
        colaborador.departamento_nome,
      ]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()

      return texto.includes(termo)
    })
  }, [baseData?.colaboradores, searchColaborador])

  const medias = useMemo(() => {
    return {
      colaborador: getMediaCampo(answers, "nota_colaborador"),
      gestor: getMediaCampo(answers, "nota_gestor"),
      geral: getMediaGeral(answers),
    }
  }, [answers])

  function montarAnswersIniciais(data: PlanoCarreiraQuestionarioData) {
    const nextAnswers: AnswerState = {}

    for (const group of data.groups) {
      for (const item of group.items) {
        nextAnswers[item.id] = {
          skill_item_id: item.id,
          nota_colaborador: item.answer?.nota_colaborador ?? null,
          nota_gestor: item.answer?.nota_gestor ?? null,
          meta_nota: item.answer?.meta_nota ?? null,
          prazo_meta: item.answer?.prazo_meta ?? null,
          comentario_colaborador: item.answer?.comentario_colaborador ?? null,
          comentario_gestor: item.answer?.comentario_gestor ?? null,
          prioridade: item.answer?.prioridade ?? null,
        }
      }
    }

    return nextAnswers
  }

  async function carregarQuestionario() {
    if (!selectedCycleId || !selectedColaboradorId) {
      toast.error("Selecione o ciclo e o colaborador.")
      return
    }

    try {
      setLoadingQuestionario(true)

      const result = await getQuestionarioPlanoCarreira({
        cycleId: selectedCycleId,
        colaboradorId: selectedColaboradorId,
      })

      if (!result.success || !result.data) {
        throw new Error(result.message)
      }

      setQuestionarioData(result.data)
      setAnswers(montarAnswersIniciais(result.data))
      setObservacoesColaborador(
        result.data.evaluation?.observacoes_colaborador ?? "",
      )
      setObservacoesGestor(result.data.evaluation?.observacoes_gestor ?? "")
      setPlanoAcao(result.data.evaluation?.plano_acao ?? "")

      toast.success("Questionário carregado com sucesso.")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o questionário.",
      )
    } finally {
      setLoadingQuestionario(false)
    }
  }

  function updateAnswer(
    skillItemId: string,
    changes: Partial<PlanoCarreiraAnswerInput>,
  ) {
    setAnswers((prev) => {
      const current = prev[skillItemId] ?? {
        skill_item_id: skillItemId,
        nota_colaborador: null,
        nota_gestor: null,
        meta_nota: null,
        prazo_meta: null,
        comentario_colaborador: null,
        comentario_gestor: null,
        prioridade: null,
      }

      return {
        ...prev,
        [skillItemId]: {
          ...current,
          ...changes,
        },
      }
    })
  }

  async function salvar(status: "rascunho" | "em_andamento" | "finalizada") {
    if (!selectedCycleId || !selectedColaboradorId) {
      toast.error("Selecione o ciclo e o colaborador.")
      return
    }

    try {
      setSaving(true)

      const result = await salvarAvaliacaoPlanoCarreira({
        cycleId: selectedCycleId,
        colaboradorId: selectedColaboradorId,
        status,
        observacoes_colaborador: observacoesColaborador,
        observacoes_gestor: observacoesGestor,
        plano_acao: planoAcao,
        answers: Object.values(answers),
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success(result.message ?? "Avaliação salva com sucesso.")

      await carregarQuestionario()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a avaliação.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando Plano de Carreira...
        </div>
      </div>
    )
  }

  if (!baseData?.canManage) {
    return (
      <Card className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-1 h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800">Acesso restrito</h2>
            <p className="mt-1 text-sm text-red-700">
              A avaliação do Plano de Carreira deve ser conduzida por diretores
              ou gestores junto com o colaborador.
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
              Avaliação de Habilidades
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Avaliação conduzida pelo gestor ou diretor junto com o
              colaborador.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Perfil atual: {baseData.currentUserRole ?? "-"}
          </div>
        </div>
      </Card>

      <SectionCard
        title="Selecionar avaliação"
        subtitle="Escolha o ciclo e o colaborador avaliado. Diretores e gestores não aparecem como avaliados."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_180px]">
          <div className="flex flex-col gap-2">
            <FieldLabel>Ciclo</FieldLabel>
            <select
              value={selectedCycleId}
              onChange={(event) => setSelectedCycleId(event.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">Selecione</option>
              {(baseData.cycles ?? []).map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Colaborador</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                value={searchColaborador}
                onChange={(event) => setSearchColaborador(event.target.value)}
                placeholder="Buscar por nome, e-mail, cargo ou departamento"
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="max-h-56 overflow-y-auto p-2">
                {colaboradoresFiltrados.length > 0 ? (
                  colaboradoresFiltrados.map((colaborador) => {
                    const isSelected = selectedColaboradorId === colaborador.id

                    return (
                      <button
                        key={colaborador.id}
                        type="button"
                        onClick={() => setSelectedColaboradorId(colaborador.id)}
                        className={`mb-2 w-full rounded-lg border px-3 py-3 text-left text-sm transition last:mb-0 ${
                          isSelected
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <p className="font-semibold">{colaborador.nome}</p>

                        <p className="mt-1 text-xs text-gray-500">
                          {colaborador.departamento_nome ?? "Sem departamento"}
                          {colaborador.cargo_nome
                            ? ` | ${colaborador.cargo_nome}`
                            : ""}
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    Nenhum colaborador encontrado para a busca.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={carregarQuestionario}
              disabled={loadingQuestionario}
              className="h-10 w-full"
            >
              {loadingQuestionario ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Carregar
            </Button>
          </div>
        </div>
      </SectionCard>

      {questionarioData ? (
        <>
          <SectionCard
            title="Resumo da avaliação"
            subtitle="Médias calculadas a partir das notas preenchidas."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Colaborador</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {questionarioData.colaborador.nome}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {questionarioData.colaborador.departamento_nome ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Média colaborador</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatNumber(medias.colaborador)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Média gestor</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatNumber(medias.gestor)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Média final</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatNumber(medias.geral)}
                </p>
              </div>
            </div>
          </SectionCard>

          {questionarioData.groups.map((group) => (
            <SectionCard
              key={group.id}
              title={group.nome}
              subtitle={group.descricao ?? undefined}
            >
              <div className="space-y-5">
                {group.items.map((item, index) => {
                  const answer = answers[item.id]
                  const notaMedia = getNotaMedia(answer)

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="mb-4 flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {index + 1}. {item.nome}
                          </p>
                          {item.descricao ? (
                            <p className="mt-1 text-sm text-gray-500">
                              {item.descricao}
                            </p>
                          ) : null}
                        </div>

                        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                          Escala {item.escala_min} a {item.escala_max}
                        </div>
                      </div>

                      <RubricaBox item={item} />

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
                        <div className="flex flex-col gap-2">
                          <FieldLabel>Nota colaborador</FieldLabel>
                          <NotaSelect
                            value={answer?.nota_colaborador ?? null}
                            onChange={(value) =>
                              updateAnswer(item.id, {
                                nota_colaborador: value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Nota gestor</FieldLabel>
                          <NotaSelect
                            value={answer?.nota_gestor ?? null}
                            onChange={(value) =>
                              updateAnswer(item.id, {
                                nota_gestor: value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Nota final</FieldLabel>
                          <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                            {formatNumber(notaMedia)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Meta</FieldLabel>
                          <NotaSelect
                            value={answer?.meta_nota ?? null}
                            onChange={(value) =>
                              updateAnswer(item.id, {
                                meta_nota: value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Prioridade</FieldLabel>
                          <select
                            value={answer?.prioridade ?? ""}
                            onChange={(event) =>
                              updateAnswer(item.id, {
                                prioridade: event.target.value || null,
                              })
                            }
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                          >
                            <option value="">-</option>
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="flex flex-col gap-2">
                          <FieldLabel>Prazo da meta</FieldLabel>
                          <input
                            value={answer?.prazo_meta ?? ""}
                            onChange={(event) =>
                              updateAnswer(item.id, {
                                prazo_meta: event.target.value || null,
                              })
                            }
                            placeholder="Ex: dez/26"
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Comentário colaborador</FieldLabel>
                          <textarea
                            value={answer?.comentario_colaborador ?? ""}
                            onChange={(event) =>
                              updateAnswer(item.id, {
                                comentario_colaborador:
                                  event.target.value || null,
                              })
                            }
                            rows={3}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FieldLabel>Comentário gestor</FieldLabel>
                          <textarea
                            value={answer?.comentario_gestor ?? ""}
                            onChange={(event) =>
                              updateAnswer(item.id, {
                                comentario_gestor: event.target.value || null,
                              })
                            }
                            rows={3}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          ))}

          <SectionCard
            title="Observações finais"
            subtitle="Registre os principais alinhamentos feitos entre gestor e colaborador."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <FieldLabel>Observações do colaborador</FieldLabel>
                <textarea
                  value={observacoesColaborador}
                  onChange={(event) =>
                    setObservacoesColaborador(event.target.value)
                  }
                  rows={5}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <FieldLabel>Observações do gestor</FieldLabel>
                <textarea
                  value={observacoesGestor}
                  onChange={(event) => setObservacoesGestor(event.target.value)}
                  rows={5}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <FieldLabel>Plano de ação</FieldLabel>
                <textarea
                  value={planoAcao}
                  onChange={(event) => setPlanoAcao(event.target.value)}
                  rows={5}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => salvar("rascunho")}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar rascunho
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => salvar("em_andamento")}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar em andamento
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() => salvar("finalizada")}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Finalizar avaliação
              </Button>
            </div>
          </SectionCard>
        </>
      ) : (
        <Card className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm text-gray-600">
            Selecione um ciclo e um colaborador para carregar o questionário do
            Plano de Carreira.
          </p>
        </Card>
      )}
    </div>
  )
}
