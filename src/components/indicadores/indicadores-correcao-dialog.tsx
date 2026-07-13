"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import {
  getIndicadoresCorrecaoDetalhes,
  salvarCorrecaoIndicadores,
  type IndicadoresCorrecaoDetalhes,
  type IndicadoresCorrecaoEntrega,
} from "@/app/actions/indicadores-dashboard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const NOTAS = [1, 2, 3, 4, 5]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  colaboradorId: string | null
  colaboradorNome: string | null
  ano: number | null
  trimestre: number | null
  onSaved: () => void | Promise<void>
}

type CampoNota =
  | "clareza_estrutura"
  | "profundidade_rigor"
  | "alinhamento_demanda"
  | "forma_profissionalismo"

function formatarData(data: string) {
  if (!data) return "—"

  const [ano, mes, dia] = data.slice(0, 10).split("-")

  if (!ano || !mes || !dia) return data

  return `${dia}/${mes}/${ano}`
}

function formatarNumero(value: number, digits = 1) {
  return value.toFixed(digits).replace(".", ",")
}

function calcularResumo(
  entregas: IndicadoresCorrecaoEntrega[],
  notaEvolucao: number | null,
) {
  if (!entregas.length) {
    const iev = notaEvolucao ? notaEvolucao * 20 : 0

    return {
      ies: 0,
      ip: 0,
      iq: 0,
      iev,
      idi: 0,
    }
  }

  const ies =
    (entregas.filter((item) => item.ies_aprovado_primeira).length /
      entregas.length) *
    100
  const ip =
    (entregas.filter((item) => item.ip_no_prazo).length / entregas.length) * 100

  const somaNotas = entregas.reduce(
    (acc, item) =>
      acc +
      item.clareza_estrutura +
      item.profundidade_rigor +
      item.alinhamento_demanda +
      item.forma_profissionalismo,
    0,
  )
  const iq = (somaNotas / (entregas.length * 4)) * 20
  const iev = notaEvolucao ? notaEvolucao * 20 : 0
  const idi = ies * 0.2 + ip * 0.2 + iq * 0.4 + iev * 0.2

  return { ies, ip, iq, iev, idi }
}

export default function IndicadoresCorrecaoDialog({
  open,
  onOpenChange,
  colaboradorId,
  colaboradorNome,
  ano,
  trimestre,
  onSaved,
}: Props) {
  const [detalhes, setDetalhes] = useState<IndicadoresCorrecaoDetalhes | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [motivo, setMotivo] = useState("")

  useEffect(() => {
    if (!open || !colaboradorId || !ano || !trimestre) {
      return
    }

    const colaboradorIdSelecionado = colaboradorId
    const anoSelecionado = ano
    const trimestreSelecionado = trimestre
    let ativo = true

    async function carregar() {
      try {
        setLoading(true)
        setDetalhes(null)
        setMotivo("")

        const data = await getIndicadoresCorrecaoDetalhes({
          colaboradorId: colaboradorIdSelecionado,
          ano: anoSelecionado,
          trimestre: trimestreSelecionado,
        })

        if (ativo) {
          setDetalhes(data)
        }
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as notas para correção.",
        )
        onOpenChange(false)
      } finally {
        if (ativo) {
          setLoading(false)
        }
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [open, colaboradorId, ano, trimestre, onOpenChange])

  const resumo = useMemo(
    () =>
      calcularResumo(detalhes?.entregas ?? [], detalhes?.nota_evolucao ?? null),
    [detalhes],
  )

  function atualizarEntrega(
    entregaId: string,
    campo: CampoNota | "ies_aprovado_primeira" | "ip_no_prazo",
    valor: number | boolean,
  ) {
    setDetalhes((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        entregas: prev.entregas.map((entrega) =>
          entrega.id === entregaId
            ? {
                ...entrega,
                [campo]: valor,
              }
            : entrega,
        ),
      }
    })
  }

  function atualizarNotaEvolucao(value: string) {
    setDetalhes((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        nota_evolucao: value ? Number(value) : null,
      }
    })
  }

  async function salvar() {
    if (!detalhes) return

    if (motivo.trim().length < 5) {
      toast.error("Informe o motivo da correção com pelo menos 5 caracteres.")
      return
    }

    try {
      setSaving(true)

      await salvarCorrecaoIndicadores({
        colaborador_id: detalhes.colaborador_id,
        ano: detalhes.ano,
        trimestre: detalhes.trimestre,
        motivo: motivo.trim(),
        nota_evolucao: detalhes.nota_evolucao,
        entregas: detalhes.entregas.map((item) => ({
          id: item.id,
          ies_aprovado_primeira: item.ies_aprovado_primeira,
          ip_no_prazo: item.ip_no_prazo,
          clareza_estrutura: item.clareza_estrutura,
          profundidade_rigor: item.profundidade_rigor,
          alinhamento_demanda: item.alinhamento_demanda,
          forma_profissionalismo: item.forma_profissionalismo,
        })),
      })

      toast.success("Notas corrigidas e indicadores recalculados.")
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a correção.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100%-1.5rem)] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Corrigir notas dos indicadores</DialogTitle>
          <DialogDescription>
            {colaboradorNome ?? "Colaborador"}
            {ano && trimestre ? ` · ${trimestre}º trimestre de ${ano}` : ""}.
            IES, IP e IQ são corrigidos nas avaliações das entregas; o IEV é
            corrigido no registro trimestral. O IDI é recalculado
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando avaliações do período...
          </div>
        ) : detalhes ? (
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ["IES", resumo.ies],
                ["IP", resumo.ip],
                ["IQ", resumo.iq],
                ["IEV", resumo.iev],
                ["IDI recalculado", resumo.idi],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border bg-muted/20 p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatarNumero(Number(value), 1)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border">
              <div className="border-b bg-muted/30 px-4 py-3">
                <h4 className="font-semibold">Avaliações das entregas</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Marque a situação correta de aprovação e prazo e ajuste as
                  quatro notas técnicas entre 1 e 5.
                </p>
              </div>

              {detalhes.entregas.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  Nenhuma entrega foi encontrada neste período. A correção de
                  IES, IP e IQ só fica disponível após o cadastro de uma
                  avaliação de entrega.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-[1180px] w-full text-sm">
                    <thead className="sticky top-0 z-20 bg-muted">
                      <tr className="border-b">
                        <th className="sticky left-0 z-30 min-w-72 bg-muted px-4 py-3 text-left font-semibold">
                          Entrega
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Data
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          IES
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          IP
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Clareza
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Rigor
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Alinhamento
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Forma
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalhes.entregas.map((entrega) => (
                        <tr
                          key={entrega.id}
                          className="border-b last:border-b-0"
                        >
                          <td className="sticky left-0 z-10 bg-background px-4 py-3">
                            <p className="font-medium">
                              {entrega.entrega_avaliada}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {entrega.codigo_projeto ??
                                "Projeto não informado"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center">
                            {formatarData(entrega.data_entrega)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={entrega.ies_aprovado_primeira}
                                onChange={(event) =>
                                  atualizarEntrega(
                                    entrega.id,
                                    "ies_aprovado_primeira",
                                    event.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border"
                              />
                              <span className="text-xs">
                                {entrega.ies_aprovado_primeira ? "Sim" : "Não"}
                              </span>
                            </label>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={entrega.ip_no_prazo}
                                onChange={(event) =>
                                  atualizarEntrega(
                                    entrega.id,
                                    "ip_no_prazo",
                                    event.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border"
                              />
                              <span className="text-xs">
                                {entrega.ip_no_prazo ? "Sim" : "Não"}
                              </span>
                            </label>
                          </td>
                          {(
                            [
                              "clareza_estrutura",
                              "profundidade_rigor",
                              "alinhamento_demanda",
                              "forma_profissionalismo",
                            ] as CampoNota[]
                          ).map((campo) => (
                            <td key={campo} className="px-3 py-3 text-center">
                              <select
                                value={entrega[campo]}
                                onChange={(event) =>
                                  atualizarEntrega(
                                    entrega.id,
                                    campo,
                                    Number(event.target.value),
                                  )
                                }
                                className="h-9 w-16 rounded-md border bg-background px-2 text-center outline-none focus:ring-2 focus:ring-ring"
                                aria-label={`${campo} da entrega ${entrega.entrega_avaliada}`}
                              >
                                {NOTAS.map((nota) => (
                                  <option key={nota} value={nota}>
                                    {nota}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="correcao_iev">Nota de evolução (IEV)</Label>
                <select
                  id="correcao_iev"
                  value={detalhes.nota_evolucao ?? ""}
                  onChange={(event) =>
                    atualizarNotaEvolucao(event.target.value)
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sem nota cadastrada</option>
                  {NOTAS.map((nota) => (
                    <option key={nota} value={nota}>
                      {nota} · equivale a {nota * 20} pontos
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Escala de 1 a 5, convertida para 20 a 100 pontos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo_correcao">Motivo da correção</Label>
                <Textarea
                  id="motivo_correcao"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Ex.: correção solicitada pelo avaliador após conferência da entrega."
                  className="min-h-24"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  O motivo é utilizado no registro de auditoria da alteração.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <Calculator className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                O sistema não permite editar o IDI diretamente. Ele é
                recalculado com os pesos atuais: IES 20%, IP 20%, IQ 40% e IEV
                20%.
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={salvar}
            disabled={loading || saving || !detalhes}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar correções
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
