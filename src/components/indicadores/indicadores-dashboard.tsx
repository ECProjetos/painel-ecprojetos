"use client"

import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { getRelatoriosEntregasIndicadores } from "@/app/actions/indicadores"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RelatorioEntregaBase = Awaited<
  ReturnType<typeof getRelatoriosEntregasIndicadores>
>[number]

type RelatorioEntrega = RelatorioEntregaBase & {
  sequencia_geral?: number
  titulo_revisao?: string
  ano?: number
  trimestre?: number
  projeto_codigo?: string | null
}

type StatusRelatorio = "OK" | "Atenção" | "Crítico"

function formatDate(date?: string | null) {
  if (!date) return "-"

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("pt-BR")
}

function formatNumber(value?: number | null) {
  return Number(value ?? 0)
    .toFixed(1)
    .replace(".", ",")
}

type InfoValue = string | number | boolean | null | undefined

function formatInfoValue(value: InfoValue) {
  if (value === null || value === undefined) {
    return "Não informado"
  }

  const text = String(value).trim()

  return text || "Não informado"
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function getStatusRelatorio(item: RelatorioEntrega): StatusRelatorio {
  const aprovado = item.ies_aprovado_primeira
  const noPrazo = item.ip_no_prazo
  const iq = Number(item.iq ?? 0)

  if (aprovado && noPrazo && iq >= 4) {
    return "OK"
  }

  if (iq >= 3) {
    return "Atenção"
  }

  return "Crítico"
}

function getStatusClass(status: StatusRelatorio) {
  if (status === "OK") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (status === "Atenção") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-rose-200 bg-rose-50 text-rose-700"
}

function getStatusDotClass(status: StatusRelatorio) {
  if (status === "OK") return "bg-emerald-500"
  if (status === "Atenção") return "bg-amber-500"
  return "bg-rose-500"
}

function getDescricaoIES(item: RelatorioEntrega) {
  if (item.ies_aprovado_primeira) {
    return "Aprovado na primeira revisão, pois não houve necessidade de ajustes significativos."
  }

  return "Não aprovado na primeira revisão, pois haverá necessidade de ajustes significativos."
}

function getDescricaoIP(item: RelatorioEntrega) {
  if (item.ip_no_prazo) {
    return "Aprovado, pois foi entregue no prazo interno acordado com o gestor."
  }

  return "Não aprovado, pois não foi entregue no prazo interno acordado com o gestor."
}

function setTextColor(pdf: jsPDF, color: "dark" | "muted") {
  if (color === "dark") {
    pdf.setTextColor(0, 0, 0)
    return
  }

  pdf.setTextColor(70, 70, 70)
}

async function loadImageAsDataUrl(src: string) {
  try {
    const response = await fetch(src)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function getImageFormat(dataUrl: string) {
  if (dataUrl.startsWith("data:image/jpeg")) return "JPEG"
  if (dataUrl.startsWith("data:image/jpg")) return "JPEG"
  return "PNG"
}

function drawFooter(pdf: jsPDF) {
  const pages = pdf.getNumberOfPages()

  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    setTextColor(pdf, "muted")
    pdf.text(String(page), 190, 287)
  }
}

async function gerarPdfRelatorio(item: RelatorioEntrega) {
  const pdf = new jsPDF("p", "mm", "a4")
  const logo = await loadImageAsDataUrl("/logo.png")

  const marginLeft = 24
  const marginRight = 24
  const contentWidth = 210 - marginLeft - marginRight
  const bottomLimit = 276

  let y = 20

  function ensureSpace(height: number) {
    if (y + height > bottomLimit) {
      pdf.addPage()
      y = 20
    }
  }

  function addWrappedText(
    text: string,
    x: number,
    maxWidth: number,
    options?: {
      fontSize?: number
      bold?: boolean
      lineHeight?: number
      color?: "dark" | "muted"
      align?: "left" | "center"
    },
  ) {
    const fontSize = options?.fontSize ?? 11
    const lineHeight = options?.lineHeight ?? 5

    pdf.setFont("helvetica", options?.bold ? "bold" : "normal")
    pdf.setFontSize(fontSize)
    setTextColor(pdf, options?.color ?? "dark")

    const lines = pdf.splitTextToSize(text || "-", maxWidth) as string[]
    ensureSpace(lines.length * lineHeight + 2)

    pdf.text(lines, x, y, {
      align: options?.align ?? "left",
      maxWidth,
    })

    y += lines.length * lineHeight
  }

  function addSectionTitle(title: string) {
    ensureSpace(12)
    y += 5
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    setTextColor(pdf, "dark")
    pdf.text(title, marginLeft, y)
    y += 8
  }

  function addInfoRow(label: string, value: InfoValue) {
    ensureSpace(7)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")
    pdf.text(label, marginLeft, y)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")

    const valueX = 72
    const lines = pdf.splitTextToSize(
      formatInfoValue(value),
      210 - valueX - marginRight,
    ) as string[]
    pdf.text(lines, valueX, y)

    y += Math.max(7, lines.length * 5)
  }

  function addParagraphBox(text: string) {
    ensureSpace(12)

    const lines = pdf.splitTextToSize(text || "-", contentWidth) as string[]

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")

    pdf.text(lines, marginLeft, y)
    y += lines.length * 5 + 2
  }

  function addIqHeader() {
    ensureSpace(10)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")

    pdf.text("Indicadores", marginLeft + 28, y)
    pdf.text("Avaliação", 148, y)

    y += 7
  }

  function addIqRow(label: string, value: string) {
    ensureSpace(7)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")

    pdf.text(label, marginLeft, y)
    pdf.text(value, 154, y)

    y += 7
  }

  function addLongTopic(title: string, text: string) {
    ensureSpace(12)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")
    pdf.text(title, marginLeft, y)
    y += 8

    const cleanText = text?.trim() || "Não informado."
    const paragraphs = cleanText.split(/\n+/).filter(Boolean)

    for (const paragraph of paragraphs) {
      addWrappedText(paragraph, marginLeft, contentWidth, {
        fontSize: 10,
        lineHeight: 5,
      })
      y += 3
    }
  }

  if (logo) {
    pdf.addImage(logo, getImageFormat(logo), marginLeft, 10, 28, 14)
  }

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(15)
  setTextColor(pdf, "dark")
  pdf.text(`REVISÃO TÉCNICA - ${item.titulo_revisao}`, 105, y, {
    align: "center",
  })

  y += 12

  addSectionTitle("1. DADOS GERAIS")
  addInfoRow("Revisor:", item.avaliador_nome ?? "Não informado")
  addInfoRow("Colaborador:", item.colaborador_nome)
  addInfoRow("Equipe:", item.equipe_colaborador)
  addInfoRow("Projeto:", item.projeto_codigo)
  addInfoRow("Produto:", item.entrega_avaliada)
  addInfoRow("Data da entrega:", formatDate(item.data_entrega))
  addInfoRow("Data da revisão:", formatDate(item.data_revisao))

  addSectionTitle("2. INDICADOR DE ESFORÇO (IES)")
  addParagraphBox(getDescricaoIES(item))

  addSectionTitle("3. INDICADOR DE PRAZO (IP)")
  addParagraphBox(getDescricaoIP(item))

  addSectionTitle("4. INDICADOR DE QUALIDADE (IQ)")
  addIqHeader()
  addIqRow("1. Clareza e estrutura:", formatNumber(item.clareza_estrutura))
  addIqRow("2. Profundidade e rigor:", formatNumber(item.profundidade_rigor))
  addIqRow(
    "3. Alinhamento à demanda do cliente:",
    formatNumber(item.alinhamento_demanda),
  )
  addIqRow(
    "4. Forma e profissionalismo:",
    formatNumber(item.forma_profissionalismo),
  )

  y += 2
  addLongTopic("5. Pontos fracos:", item.pontos_fracos ?? "")
  addLongTopic("6. Pontos fortes:", item.pontos_fortes ?? "")

  ensureSpace(8)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  setTextColor(pdf, "dark")
  pdf.text("IQ MÉDIO:", marginLeft, y)
  pdf.text(formatNumber(item.iq), 154, y)

  drawFooter(pdf)

  return pdf
}

export default function IndicadoresRelatorios() {
  const [relatorios, setRelatorios] = useState<RelatorioEntrega[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [anoFiltro, setAnoFiltro] = useState("")
  const [trimestreFiltro, setTrimestreFiltro] = useState("")
  const [equipeFiltro, setEquipeFiltro] = useState("")

  useEffect(() => {
    async function loadRelatorios() {
      try {
        setLoading(true)

        const data = await getRelatoriosEntregasIndicadores()
        
        setRelatorios(data)

      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os relatórios.")
      } finally {
        setLoading(false)
      }
    }

    loadRelatorios()
  }, [])

  const anos = useMemo(() => {
    return Array.from(
      new Set(
        relatorios
          .map((item) => item.ano)
          .filter((ano): ano is number => typeof ano === "number"),
      ),
    ).sort((a, b) => b - a)
  }, [relatorios])

  const trimestres = useMemo(() => {
    return Array.from(
      new Set(
        relatorios
          .map((item) => item.trimestre)
          .filter(
            (trimestre): trimestre is number => typeof trimestre === "number",
          ),
      ),
    ).sort((a, b) => a - b)
  }, [relatorios])

  const equipes = useMemo(() => {
    return Array.from(
      new Set(
        relatorios
          .map((item) => item.equipe_colaborador)
          .filter(
            (equipe): equipe is string =>
              typeof equipe === "string" && equipe.trim().length > 0,
          ),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [relatorios])

  const relatoriosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return relatorios.filter((item) => {
      const status = getStatusRelatorio(item)

      const matchBusca =
        !termo ||
        formatInfoValue(item.numero_relatorio).toLowerCase().includes(termo) ||
        formatInfoValue(item.entrega_avaliada).toLowerCase().includes(termo) ||
        formatInfoValue(item.colaborador_nome).toLowerCase().includes(termo) ||
        formatInfoValue(item.projeto_nome).toLowerCase().includes(termo) ||
        formatInfoValue(item.projeto_codigo).toLowerCase().includes(termo)

      const matchStatus = !statusFiltro || status === statusFiltro
      const matchAno = !anoFiltro || item.ano === Number(anoFiltro)
      const matchTrimestre =
        !trimestreFiltro || item.trimestre === Number(trimestreFiltro)
      const matchEquipe =
        !equipeFiltro || item.equipe_colaborador === equipeFiltro

      return (
        matchBusca && matchStatus && matchAno && matchTrimestre && matchEquipe
      )
    })
  }, [
    relatorios,
    busca,
    statusFiltro,
    anoFiltro,
    trimestreFiltro,
    equipeFiltro,
  ])

  const totalRelatorios = relatoriosFiltrados.length

  const totalOk = useMemo(
    () =>
      relatoriosFiltrados.filter((item) => getStatusRelatorio(item) === "OK")
        .length,
    [relatoriosFiltrados],
  )

  const totalAtencao = useMemo(
    () =>
      relatoriosFiltrados.filter(
        (item) => getStatusRelatorio(item) === "Atenção",
      ).length,
    [relatoriosFiltrados],
  )

  const totalCritico = useMemo(
    () =>
      relatoriosFiltrados.filter(
        (item) => getStatusRelatorio(item) === "Crítico",
      ).length,
    [relatoriosFiltrados],
  )

  const relatoriosPrioritarios = useMemo(() => {
    return relatoriosFiltrados
      .filter((item) => getStatusRelatorio(item) !== "OK")
      .slice(0, 5)
  }, [relatoriosFiltrados])

  function limparFiltros() {
    setBusca("")
    setStatusFiltro("")
    setAnoFiltro("")
    setTrimestreFiltro("")
    setEquipeFiltro("")
  }

  async function baixarPdf(item: RelatorioEntrega) {
    try {
      setGerandoPdfId(item.id)

      const pdf = await gerarPdfRelatorio(item)

      const fileName = sanitizeFileName(
        `${item.sequencia_geral ?? ""}. ${item.numero_relatorio ?? "relatorio"}`,
      )

      pdf.save(`${fileName}.pdf`)

      toast.success("PDF gerado com sucesso.")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível gerar o PDF.")
    } finally {
      setGerandoPdfId(null)
    }
  }

  async function baixarTodosFiltrados() {
    if (!relatoriosFiltrados.length) return

    toast.info("Iniciando geração dos PDFs filtrados.")

    for (const item of relatoriosFiltrados) {
      await baixarPdf(item)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Relatórios de Revisão Técnica
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Acompanhamento estratégico das entregas avaliadas. Use os filtros
              para localizar relatórios por colaborador, equipe, projeto, status
              e período.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={baixarTodosFiltrados}
            disabled={!relatoriosFiltrados.length || Boolean(gerandoPdfId)}
            className="rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar filtrados
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Relatórios filtrados
            </p>
            <p className="mt-1 text-2xl font-bold">{totalRelatorios}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <p className="text-sm">OK</p>
            <p className="mt-1 text-2xl font-bold">{totalOk}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
            <p className="text-sm">Atenção</p>
            <p className="mt-1 text-2xl font-bold">{totalAtencao}</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <p className="text-sm">Crítico</p>
            <p className="mt-1 text-2xl font-bold">{totalCritico}</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="busca_relatorio">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca_relatorio"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Código, entrega, colaborador ou projeto"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={statusFiltro}
              onChange={(event) => setStatusFiltro(event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="OK">OK</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <select
              value={anoFiltro}
              onChange={(event) => setAnoFiltro(event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {anos.map((ano) => (
                <option key={ano} value={String(ano)}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Trimestre</Label>
            <select
              value={trimestreFiltro}
              onChange={(event) => setTrimestreFiltro(event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {trimestres.map((trimestre) => (
                <option key={trimestre} value={String(trimestre)}>
                  {trimestre}º trimestre
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label>Equipe</Label>
            <select
              value={equipeFiltro}
              onChange={(event) => setEquipeFiltro(event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas</option>
              {equipes.map((equipe) => (
                <option key={equipe} value={equipe}>
                  {equipe}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={limparFiltros}
              className="h-11 rounded-xl"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      {relatoriosPrioritarios.length > 0 && (
        <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Entregas que precisam de atenção</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {relatoriosPrioritarios.map((item) => {
              const status = getStatusRelatorio(item)

              return (
                <div
                  key={`prioritario-${item.id}`}
                  className="rounded-xl border bg-white/70 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(
                        status,
                      )}`}
                    />
                    <span className="text-xs font-semibold">{status}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {item.entrega_avaliada}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.colaborador_nome} · {item.numero_relatorio}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando relatórios...
          </div>
        ) : relatoriosFiltrados.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Nenhuma entrega avaliada encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="max-h-[660px] overflow-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Entrega</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Equipe</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Revisão
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">IQ</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">PDF</th>
                </tr>
              </thead>

              <tbody>
                {relatoriosFiltrados.map((item) => {
                  const status = getStatusRelatorio(item)

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{item.numero_relatorio}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.trimestre}º tri. {item.ano}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-violet-500" />
                          <div>
                            <p className="font-medium">
                              {item.entrega_avaliada}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Projeto: {item.projeto_codigo ?? "Não informado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">{item.colaborador_nome}</td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {item.equipe_colaborador}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {formatDate(item.data_revisao)}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold">
                        {formatNumber(item.iq)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => baixarPdf(item)}
                          disabled={gerandoPdfId === item.id}
                          className="rounded-xl"
                        >
                          {gerandoPdfId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Baixar PDF
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
