"use client"

import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent } from "react"
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
  sequencia_geral?: number | null
  sequencia_relatorio?: number | null
  numero_sequencial?: number | null
  titulo_revisao?: string | null
  numero_relatorio?: string | null
  codigo_relatorio?: string | null
  arquivo_nome?: string | null
  ano?: number | null
  trimestre?: number | null
  projeto_codigo?: string | null
  codigo_projeto?: string | null
  projeto_nome?: string | null
  data_revisao?: string | null
  data_entrega?: string | null
}

type CodigoRelatorio = {
  sequencia: number
  sequenciaFormatada: string
  projetoCodigo: string
  ano: number
  tituloRevisao: string
  numeroArquivo: string
  nomeDownload: string
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

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .trim()
}

function getNullableText(value: unknown) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()
  return text || null
}

function getNumberFromUnknown(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function getAnoFromDate(value?: string | null) {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getFullYear()
}

function getAnoRelatorio(item: RelatorioEntrega) {
  return (
    getNumberFromUnknown(item.ano) ??
    getAnoFromDate(item.data_revisao) ??
    getAnoFromDate(item.data_entrega) ??
    new Date().getFullYear()
  )
}

function extractProjetoCodigoFromText(value?: string | null) {
  const text = getNullableText(value)?.toUpperCase()

  if (!text) return null

  const patterns = [
    /EC-REV-([A-Z]{2,6}[0-9]{1,4})-/i,
    /REV-([A-Z]{2,6}[0-9]{1,4})-/i,
    /([A-Z]{2,6}[0-9]{1,4})-\d{3}/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function getProjetoCodigo(item: RelatorioEntrega) {
  const candidates = [
    item.projeto_codigo,
    item.codigo_projeto,
    item.numero_relatorio,
    item.codigo_relatorio,
    item.titulo_revisao,
    item.arquivo_nome,
  ]

  for (const candidate of candidates) {
    const parsed = extractProjetoCodigoFromText(candidate)
    if (parsed) return parsed

    const text = getNullableText(candidate)
    if (text && /^[A-Za-z]{2,6}[0-9]{1,4}$/.test(text)) {
      return text.toUpperCase()
    }
  }

  return "PROJETO"
}

function extractSequenciaFromText(value?: string | null) {
  const text = getNullableText(value)

  if (!text) return null

  const patterns = [
    /EC-REV-[A-Z]{2,6}[0-9]{1,4}-(\d{1,3})-/i,
    /REV-[A-Z]{2,6}[0-9]{1,4}-(\d{1,3})-/i,
    /[A-Z]{2,6}[0-9]{1,4}-(\d{1,3})\/?/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    const sequence = getNumberFromUnknown(match?.[1])

    if (sequence) return sequence
  }

  return null
}

function getExistingSequencia(item: RelatorioEntrega) {
  return (
    getNumberFromUnknown(item.sequencia_relatorio) ??
    getNumberFromUnknown(item.numero_sequencial) ??
    extractSequenciaFromText(item.numero_relatorio) ??
    extractSequenciaFromText(item.codigo_relatorio) ??
    extractSequenciaFromText(item.titulo_revisao) ??
    extractSequenciaFromText(item.arquivo_nome)
  )
}

function getItemSortKey(item: RelatorioEntrega) {
  return [
    item.data_revisao ?? "",
    item.data_entrega ?? "",
    String(item.id ?? ""),
  ].join("|")
}

function getSequenciaRelatorio(
  item: RelatorioEntrega,
  relatorios: RelatorioEntrega[],
) {
  const existing = getExistingSequencia(item)

  if (existing) return existing

  const projetoCodigo = getProjetoCodigo(item)
  const ano = getAnoRelatorio(item)

  const grupo = relatorios
    .filter(
      (relatorio) =>
        getProjetoCodigo(relatorio) === projetoCodigo &&
        getAnoRelatorio(relatorio) === ano,
    )
    .sort((a, b) => getItemSortKey(a).localeCompare(getItemSortKey(b)))

  const index = grupo.findIndex(
    (relatorio) => String(relatorio.id) === String(item.id),
  )

  return index >= 0 ? index + 1 : 1
}

function getCodigoRelatorio(
  item: RelatorioEntrega,
  relatorios: RelatorioEntrega[],
): CodigoRelatorio {
  const projetoCodigo = getProjetoCodigo(item)
  const ano = getAnoRelatorio(item)
  const sequencia = getSequenciaRelatorio(item, relatorios)
  const sequenciaFormatada = String(sequencia).padStart(3, "0")
  const tituloRevisao = `${projetoCodigo}-${sequenciaFormatada}/${ano}`
  const numeroArquivo = `EC-REV-${projetoCodigo}-${sequenciaFormatada}-${ano}`
  const prefixoLista = getNumberFromUnknown(item.sequencia_geral)
  const nomeDownload = prefixoLista
    ? `${prefixoLista}. ${numeroArquivo}`
    : numeroArquivo

  return {
    sequencia,
    sequenciaFormatada,
    projetoCodigo,
    ano,
    tituloRevisao,
    numeroArquivo,
    nomeDownload,
  }
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

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297

const REPORT_MARGIN_LEFT = 29
const REPORT_MARGIN_RIGHT = 29
const REPORT_CONTENT_WIDTH =
  PAGE_WIDTH - REPORT_MARGIN_LEFT - REPORT_MARGIN_RIGHT

const REPORT_BLUE: [number, number, number] = [33, 94, 153]
const REPORT_FOOTER_BLUE: [number, number, number] = [37, 91, 151]
const REPORT_LIGHT_BLUE: [number, number, number] = [180, 204, 228]
const REPORT_MEDIUM_BLUE: [number, number, number] = [118, 159, 199]
const REPORT_DARK_BLUE: [number, number, number] = [11, 42, 96]

function setTextColor(pdf: jsPDF, color: "dark" | "muted" | "blue") {
  if (color === "blue") {
    pdf.setTextColor(REPORT_BLUE[0], REPORT_BLUE[1], REPORT_BLUE[2])
    return
  }

  if (color === "muted") {
    pdf.setTextColor(70, 70, 70)
    return
  }

  pdf.setTextColor(0, 0, 0)
}

function drawParallelogram(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  skew: number,
  color: [number, number, number],
) {
  pdf.setFillColor(color[0], color[1], color[2])
  ;(pdf as any).triangle(
    x + skew,
    y,
    x + width,
    y,
    x + width - skew,
    y + height,
    "F",
  )
  ;(pdf as any).triangle(
    x + skew,
    y,
    x + width - skew,
    y + height,
    x,
    y + height,
    "F",
  )
}

let reportBackgroundCache: string | null = null

async function loadReportBackgroundImage() {
  if (reportBackgroundCache) return reportBackgroundCache

  try {
    const response = await fetch("/modelo-pdf-fundo.png")

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject

      reader.readAsDataURL(blob)
    })

    reportBackgroundCache = dataUrl
    return dataUrl
  } catch {
    return null
  }
}

function drawReportBackground(pdf: jsPDF, backgroundImage: string | null) {
  if (backgroundImage) {
    pdf.addImage(backgroundImage, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    return
  }

  drawReportHeader(pdf)
  drawReportFooter(pdf)
}

function drawReportHeader(pdf: jsPDF) {
  const headerY = 8
  const headerHeight = 13

  pdf.setDrawColor(255, 255, 255)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(15)
  pdf.setTextColor(44, 91, 159)
  pdf.text("EC", 22, 16.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(62, 62, 62)
  pdf.text("projetos", 33.5, 16.5)

  drawParallelogram(pdf, 67, headerY, 15, headerHeight, 5, REPORT_DARK_BLUE)
  drawParallelogram(pdf, 83, headerY, 15, headerHeight, 5, [69, 120, 184])
  drawParallelogram(pdf, 99, headerY, 15, headerHeight, 5, [135, 162, 201])

  pdf.setFillColor(
    REPORT_LIGHT_BLUE[0],
    REPORT_LIGHT_BLUE[1],
    REPORT_LIGHT_BLUE[2],
  )
  pdf.rect(111, headerY, 99, headerHeight, "F")
}

function drawReportFooter(pdf: jsPDF) {
  pdf.setFillColor(
    REPORT_FOOTER_BLUE[0],
    REPORT_FOOTER_BLUE[1],
    REPORT_FOOTER_BLUE[2],
  )
  pdf.rect(0, PAGE_HEIGHT - 5, PAGE_WIDTH, 3, "F")
}

function drawPageNumbers(pdf: jsPDF) {
  const pages = pdf.getNumberOfPages()

  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    setTextColor(pdf, "muted")
    pdf.text(String(page), PAGE_WIDTH / 2, 285, { align: "center" })
  }
}

async function gerarPdfRelatorio(
  item: RelatorioEntrega,
  codigo: CodigoRelatorio,
) {
  const pdf = new jsPDF("p", "mm", "a4")
  const reportBackgroundImage = await loadReportBackgroundImage()
  const marginLeft = REPORT_MARGIN_LEFT
  const marginRight = REPORT_MARGIN_RIGHT
  const contentWidth = REPORT_CONTENT_WIDTH
  const bottomLimit = 274

  let y = 34

  function startPage(options?: { showTitle?: boolean }) {
    drawReportBackground(pdf, reportBackgroundImage)

    if (options?.showTitle) {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(13.5)
      setTextColor(pdf, "blue")
      pdf.text(
        `REVISÃO TÉCNICA - ${codigo.tituloRevisao}`,
        PAGE_WIDTH / 2,
        38,
        {
          align: "center",
        },
      )

      y = 48
      return
    }

    y = 34
  }

  function ensureSpace(height: number) {
    if (y + height > bottomLimit) {
      pdf.addPage()
      startPage()
    }
  }

  function normalizeText(value: string | number | null | undefined) {
    if (value === null || value === undefined) return "Não informado"

    const text = String(value).trim()
    return text || "Não informado"
  }

  function drawLines(
    lines: string[],
    x: number,
    initialY: number,
    lineHeight: number,
    options?: {
      align?: "left" | "center"
      maxWidth?: number
    },
  ) {
    lines.forEach((line, index) => {
      pdf.text(line, x, initialY + index * lineHeight, {
        align: options?.align ?? "left",
        maxWidth: options?.maxWidth,
      })
    })
  }

  function addSectionTitle(title: string) {
    ensureSpace(12)

    y += 5

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12.3)
    setTextColor(pdf, "blue")
    pdf.text(title, marginLeft, y)

    y += 8
  }

  function addInfoRow(
    label: string,
    value: string | number | null | undefined,
  ) {
    const valueText = normalizeText(value)
    const labelWidth = 75
    const valueWidth = contentWidth - labelWidth

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.5)

    const valueLines = pdf.splitTextToSize(
      valueText,
      valueWidth - 4,
    ) as string[]

    const rowHeight = Math.max(5.8, valueLines.length * 4.6 + 1.5)

    ensureSpace(rowHeight)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y, labelWidth, rowHeight, "S")
    pdf.rect(marginLeft + labelWidth, y, valueWidth, rowHeight, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    pdf.text(label, marginLeft + 2, y + 4.2)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    drawLines(valueLines, marginLeft + labelWidth + 2, y + 4.2, 4.6, {
      maxWidth: valueWidth - 4,
    })

    y += rowHeight
  }

  function addParagraphBox(text: string) {
    const cleanText = normalizeText(text)
    const lineHeight = 4.8
    const paddingX = 2
    const paddingTop = 3.8
    const paddingBottom = 2.5
    const lines = pdf.splitTextToSize(
      cleanText,
      contentWidth - paddingX * 2,
    ) as string[]

    let index = 0

    while (index < lines.length) {
      const availableHeight = bottomLimit - y
      const availableLines = Math.max(
        1,
        Math.floor((availableHeight - paddingTop - paddingBottom) / lineHeight),
      )

      if (availableHeight < 14) {
        pdf.addPage()
        startPage()
        continue
      }

      const chunk = lines.slice(index, index + availableLines)
      const boxHeight = Math.max(
        8,
        chunk.length * lineHeight + paddingTop + paddingBottom,
      )

      ensureSpace(boxHeight)

      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.15)
      pdf.rect(marginLeft, y, contentWidth, boxHeight, "S")

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      setTextColor(pdf, "dark")
      drawLines(chunk, marginLeft + paddingX, y + paddingTop, lineHeight, {
        maxWidth: contentWidth - paddingX * 2,
      })

      y += boxHeight + 2
      index += chunk.length
    }
  }

  function addIqHeader() {
    const labelWidth = 75
    const valueWidth = contentWidth - labelWidth
    const rowHeight = 6.5

    ensureSpace(rowHeight)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y, labelWidth, rowHeight, "S")
    pdf.rect(marginLeft + labelWidth, y, valueWidth, rowHeight, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")

    pdf.text("Indicadores", marginLeft + labelWidth / 2, y + 4.4, {
      align: "center",
    })

    pdf.text("Avaliação", marginLeft + labelWidth + valueWidth / 2, y + 4.4, {
      align: "center",
    })

    y += rowHeight
  }

  function addIqRow(label: string, value: string) {
    const labelWidth = 75
    const valueWidth = contentWidth - labelWidth
    const rowHeight = 6

    ensureSpace(rowHeight)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y, labelWidth, rowHeight, "S")
    pdf.rect(marginLeft + labelWidth, y, valueWidth, rowHeight, "S")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")

    pdf.text(label, marginLeft + 2, y + 4.2)
    pdf.text(value, marginLeft + labelWidth + valueWidth / 2, y + 4.2, {
      align: "center",
    })

    y += rowHeight
  }

  function addTopicLabel(label: string) {
    const rowHeight = 7

    ensureSpace(rowHeight)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y, contentWidth, rowHeight, "S")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.7)
    setTextColor(pdf, "dark")
    pdf.text(label, marginLeft + 2, y + 4.6)

    y += rowHeight
  }

  function addLongTextInsideTable(text: string) {
    const cleanText = normalizeText(text)
    const paragraphs = cleanText
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    const lineHeight = 4.8
    const paddingX = 2
    const paddingTop = 5
    const paddingBottom = 4

    for (const paragraph of paragraphs) {
      const lines = pdf.splitTextToSize(
        paragraph,
        contentWidth - paddingX * 2,
      ) as string[]

      let index = 0

      while (index < lines.length) {
        const availableHeight = bottomLimit - y

        if (availableHeight < 18) {
          pdf.addPage()
          startPage()
          continue
        }

        const availableLines = Math.max(
          1,
          Math.floor(
            (availableHeight - paddingTop - paddingBottom) / lineHeight,
          ),
        )

        const chunk = lines.slice(index, index + availableLines)
        const boxHeight = Math.max(
          12,
          chunk.length * lineHeight + paddingTop + paddingBottom,
        )

        ensureSpace(boxHeight)

        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.15)
        pdf.rect(marginLeft, y, contentWidth, boxHeight, "S")

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        setTextColor(pdf, "dark")

        drawLines(chunk, marginLeft + paddingX, y + paddingTop, lineHeight, {
          maxWidth: contentWidth - paddingX * 2,
        })

        y += boxHeight
        index += chunk.length
      }

      y += 2
    }
  }

  function addIqAverageRow() {
    const labelWidth = 75
    const valueWidth = contentWidth - labelWidth
    const rowHeight = 7

    ensureSpace(rowHeight)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y, labelWidth, rowHeight, "S")
    pdf.rect(marginLeft + labelWidth, y, valueWidth, rowHeight, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.8)
    setTextColor(pdf, "dark")
    pdf.text("IQ MÉDIO:", marginLeft + 2, y + 4.7)
    pdf.text(
      formatNumber(item.iq),
      marginLeft + labelWidth + valueWidth / 2,
      y + 4.7,
      {
        align: "center",
      },
    )

    y += rowHeight
  }

  startPage({ showTitle: true })

  addSectionTitle("1. DADOS GERAIS")
  addInfoRow("Revisor:", item.avaliador_nome ?? "Não informado")
  addInfoRow("Colaborador:", item.colaborador_nome)
  addInfoRow("Equipe:", item.equipe_colaborador)
  addInfoRow("Projeto:", codigo.projetoCodigo)
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

  addTopicLabel("5. Pontos fracos:")
  addLongTextInsideTable(item.pontos_fracos ?? "")

  addTopicLabel("6. Pontos fortes:")
  addLongTextInsideTable(item.pontos_fortes ?? "")

  addIqAverageRow()

  drawPageNumbers(pdf)

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

        setRelatorios(data as RelatorioEntrega[])
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
          .map((item) => getNumberFromUnknown(item.ano))
          .filter((value): value is number => value !== null),
      ),
    ).sort((a, b) => b - a)
  }, [relatorios])

  const trimestres = useMemo(() => {
    return Array.from(
      new Set(
        relatorios
          .map((item) => getNumberFromUnknown(item.trimestre))
          .filter((value): value is number => value !== null),
      ),
    ).sort((a, b) => a - b)
  }, [relatorios])

  const equipes = useMemo(() => {
    return Array.from(
      new Set(
        relatorios
          .map((item) => getNullableText(item.equipe_colaborador))
          .filter((value): value is string => value !== null),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [relatorios])

  const relatoriosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return relatorios.filter((item) => {
      const status = getStatusRelatorio(item)

      const matchBusca =
        !termo ||
        getCodigoRelatorio(item, relatorios)
          .numeroArquivo.toLowerCase()
          .includes(termo) ||
        (item.numero_relatorio ?? "").toLowerCase().includes(termo) ||
        (item.codigo_relatorio ?? "").toLowerCase().includes(termo) ||
        item.entrega_avaliada.toLowerCase().includes(termo) ||
        item.colaborador_nome.toLowerCase().includes(termo) ||
        (item.projeto_nome ?? "").toLowerCase().includes(termo) ||
        getProjetoCodigo(item).toLowerCase().includes(termo)

      const matchStatus = !statusFiltro || status === statusFiltro
      const matchAno = !anoFiltro || getAnoRelatorio(item) === Number(anoFiltro)
      const matchTrimestre =
        !trimestreFiltro ||
        getNumberFromUnknown(item.trimestre) === Number(trimestreFiltro)
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
      setGerandoPdfId(String(item.id))

      const codigo = getCodigoRelatorio(item, relatorios)
      const pdf = await gerarPdfRelatorio(item, codigo)
      const fileName = sanitizeFileName(codigo.nomeDownload)

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
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="busca_relatorio">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca_relatorio"
                value={busca}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setBusca(event.target.value)
                }
                placeholder="Código, entrega, colaborador ou projeto"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={statusFiltro}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setStatusFiltro(event.target.value)
              }
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
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setAnoFiltro(event.target.value)
              }
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
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setTrimestreFiltro(event.target.value)
              }
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
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setEquipeFiltro(event.target.value)
              }
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
                    {item.colaborador_nome} ·{" "}
                    {getCodigoRelatorio(item, relatorios).numeroArquivo}
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
          <div className="max-h-[660px] w-full overflow-auto">
            <table className="min-w-[1220px] w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="w-[160px] px-3 py-3 text-left font-semibold">
                    Código
                  </th>
                  <th className="w-[290px] px-3 py-3 text-left font-semibold">
                    Entrega
                  </th>
                  <th className="w-[180px] px-3 py-3 text-left font-semibold">
                    Colaborador
                  </th>
                  <th className="w-[220px] px-3 py-3 text-left font-semibold">
                    Equipe
                  </th>
                  <th className="w-[105px] px-3 py-3 text-center font-semibold">
                    Revisão
                  </th>
                  <th className="w-[70px] px-3 py-3 text-center font-semibold">
                    IQ
                  </th>
                  <th className="w-[100px] px-3 py-3 text-center font-semibold">
                    Status
                  </th>
                  <th className="w-[145px] px-3 py-3 text-center font-semibold">
                    PDF
                  </th>
                </tr>
              </thead>

              <tbody>
                {relatoriosFiltrados.map((item) => {
                  const status = getStatusRelatorio(item)
                  const codigo = getCodigoRelatorio(item, relatorios)

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="break-words px-3 py-3 align-top">
                        <p className="font-semibold">{codigo.numeroArquivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.trimestre}º tri. {item.ano}
                        </p>
                      </td>

                      <td className="break-words px-3 py-3 align-top">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-violet-500" />
                          <div>
                            <p className="font-medium">
                              {item.entrega_avaliada}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Projeto: {codigo.projetoCodigo}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="break-words px-3 py-3 align-top">
                        {item.colaborador_nome}
                      </td>

                      <td className="break-words px-3 py-3 align-top text-muted-foreground">
                        {item.equipe_colaborador}
                      </td>

                      <td className="px-3 py-3 text-center align-top">
                        {formatDate(item.data_revisao)}
                      </td>

                      <td className="px-3 py-3 text-center align-top font-semibold">
                        {formatNumber(item.iq)}
                      </td>

                      <td className="px-3 py-3 text-center align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="w-[145px] min-w-[145px] px-3 py-3 text-center align-top">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => baixarPdf(item)}
                          disabled={gerandoPdfId === String(item.id)}
                          className="mx-auto h-9 w-[118px] justify-center gap-2 whitespace-nowrap rounded-xl px-3"
                        >
                          {gerandoPdfId === String(item.id) ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 shrink-0" />
                          )}
                          <span>Baixar PDF</span>
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
