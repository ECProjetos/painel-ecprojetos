import jsPDF from "jspdf"

export type StatusRelatorioIndicador = "OK" | "Atenção" | "Crítico"

export type RelatorioIndicadorPdfItem = {
  id?: string | number | null
  sequencia_geral?: number | null
  sequencia_relatorio?: number | null
  numero_sequencial?: number | null
  titulo_revisao?: string | null
  numero_relatorio?: string | null
  codigo_relatorio?: string | null
  arquivo_nome?: string | null

  ano?: number | string | null
  trimestre?: number | string | null

  avaliador_nome?: string | null
  colaborador_id?: string | null
  colaborador_nome?: string | null
  equipe_colaborador?: string | null

  projeto_codigo?: string | null
  codigo_projeto?: string | null
  projeto_nome?: string | null

  entrega_avaliada?: string | null
  data_revisao?: string | null
  data_entrega?: string | null
  created_at?: string | null

  ies_aprovado_primeira?: boolean | null
  ip_no_prazo?: boolean | null

  clareza_estrutura?: number | string | null
  profundidade_rigor?: number | string | null
  alinhamento_demanda?: number | string | null
  forma_profissionalismo?: number | string | null
  iq?: number | string | null

  pontos_fortes?: string | null
  pontos_fracos?: string | null
  comentario_geral?: string | null
}

export type CodigoRelatorioIndicador = {
  sequencia: number
  sequenciaFormatada: string
  projetoCodigo: string
  ano: number
  tituloRevisao: string
  numeroArquivo: string
  nomeDownload: string
}

export function formatDateRelatorioIndicador(date?: string | null) {
  if (!date) return "-"

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("pt-BR")
}

export function formatNumberRelatorioIndicador(value?: unknown) {
  const normalized =
    typeof value === "string" ? value.trim().replace(",", ".") : value

  const numberValue = Number(normalized ?? 0)

  if (!Number.isFinite(numberValue)) {
    return "0,0"
  }

  return numberValue.toFixed(1).replace(".", ",")
}

export function sanitizeRelatorioIndicadorFileName(value: string) {
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

  const normalized =
    typeof value === "string" ? value.trim().replace(",", ".") : value

  const numberValue = Number(normalized)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getAnoFromDate(value?: string | null) {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getFullYear()
}

function getAnoRelatorio(item: RelatorioIndicadorPdfItem) {
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

    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

function getProjetoCodigo(item: RelatorioIndicadorPdfItem) {
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

    if (parsed) {
      return parsed
    }

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

    if (sequence) {
      return sequence
    }
  }

  return null
}

function getExistingSequencia(item: RelatorioIndicadorPdfItem) {
  return (
    getNumberFromUnknown(item.sequencia_relatorio) ??
    getNumberFromUnknown(item.numero_sequencial) ??
    extractSequenciaFromText(item.numero_relatorio) ??
    extractSequenciaFromText(item.codigo_relatorio) ??
    extractSequenciaFromText(item.titulo_revisao) ??
    extractSequenciaFromText(item.arquivo_nome)
  )
}

function getItemSortKey(item: RelatorioIndicadorPdfItem) {
  return [
    item.data_revisao ?? "",
    item.data_entrega ?? "",
    String(item.id ?? ""),
  ].join("|")
}

function getSequenciaRelatorio(
  item: RelatorioIndicadorPdfItem,
  relatorios: RelatorioIndicadorPdfItem[],
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

export function getCodigoRelatorioIndicador(
  item: RelatorioIndicadorPdfItem,
  relatorios: RelatorioIndicadorPdfItem[],
): CodigoRelatorioIndicador {
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

function getDescricaoIES(item: RelatorioIndicadorPdfItem) {
  if (item.ies_aprovado_primeira) {
    return "Aprovado na primeira revisão, pois não houve necessidade de ajustes significativos."
  }

  return "Não aprovado na primeira revisão, pois haverá necessidade de ajustes significativos."
}

function getDescricaoIP(item: RelatorioIndicadorPdfItem) {
  if (item.ip_no_prazo) {
    return "Aprovado, pois foi entregue no prazo interno acordado com o gestor."
  }

  return "Não aprovado, pois não foi entregue no prazo interno acordado com o gestor."
}

function setTextColor(pdf: jsPDF, color: "dark" | "muted" | "blue") {
  if (color === "blue") {
    pdf.setTextColor(29, 93, 140)
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

function drawReportHeader(pdf: jsPDF) {
  const headerY = 7.5
  const headerHeight = 13

  pdf.setDrawColor(255, 255, 255)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.setTextColor(23, 72, 129)
  pdf.text("EC", 22, 16.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(55, 55, 55)
  pdf.text("projetos", 34, 16.5)

  drawParallelogram(pdf, 67, headerY, 16, headerHeight, 5, [11, 42, 96])
  drawParallelogram(pdf, 83, headerY, 16, headerHeight, 5, [38, 86, 157])
  drawParallelogram(pdf, 99, headerY, 16, headerHeight, 5, [71, 122, 184])

  pdf.setFillColor(117, 159, 198)
  pdf.rect(111, headerY, 91, headerHeight, "F")
}

function drawReportFooter(pdf: jsPDF) {
  const pageWidth = 210
  const pageHeight = 297

  pdf.setFillColor(37, 91, 151)
  pdf.rect(0, pageHeight - 5, pageWidth, 3, "F")
}

function drawPageNumbers(pdf: jsPDF) {
  const pages = pdf.getNumberOfPages()

  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    setTextColor(pdf, "muted")
    pdf.text(String(page), 182, 280)
  }
}

export async function gerarPdfRelatorioIndicador(
  item: RelatorioIndicadorPdfItem,
  codigo: CodigoRelatorioIndicador,
): Promise<jsPDF> {
  const pdf = new jsPDF("p", "mm", "a4")

  const marginLeft = 29
  const marginRight = 29
  const contentWidth = 210 - marginLeft - marginRight
  const bottomLimit = 260

  let y = 34

  function startPage(options?: { showTitle?: boolean }) {
    drawReportHeader(pdf)
    drawReportFooter(pdf)

    if (options?.showTitle) {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(13)
      pdf.setTextColor(29, 93, 140)
      pdf.text(`REVISÃO TÉCNICA - ${codigo.tituloRevisao}`, 105, 33, {
        align: "center",
      })

      y = 45
      return
    }

    y = 42
  }

  function addNewContentPage() {
    pdf.addPage()
    startPage()
    y = 42
  }

  function ensureSpace(height: number) {
    if (y + height > bottomLimit) {
      addNewContentPage()
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
      color?: "dark" | "muted" | "blue"
      align?: "left" | "center"
    },
  ) {
    const fontSize = options?.fontSize ?? 10
    const lineHeight = options?.lineHeight ?? 5
    const lines = pdf.splitTextToSize(text || "-", maxWidth) as string[]

    pdf.setFont("helvetica", options?.bold ? "bold" : "normal")
    pdf.setFontSize(fontSize)
    setTextColor(pdf, options?.color ?? "dark")

    for (const line of lines) {
      if (y + lineHeight > bottomLimit) {
        addNewContentPage()
        pdf.setFont("helvetica", options?.bold ? "bold" : "normal")
        pdf.setFontSize(fontSize)
        setTextColor(pdf, options?.color ?? "dark")
      }

      pdf.text(line, x, y, {
        align: options?.align ?? "left",
        maxWidth,
      })

      y += lineHeight
    }
  }

  function addSectionTitle(title: string) {
    ensureSpace(14)

    y += 5

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.setTextColor(29, 93, 140)
    pdf.text(title, marginLeft, y)

    y += 8
  }

  function formatInfoValue(value: string | number | null | undefined) {
    if (value === null || value === undefined) return "Não informado"

    const text = String(value).trim()
    return text || "Não informado"
  }

  function addInfoRow(
    label: string,
    value: string | number | null | undefined,
  ) {
    const valueText = formatInfoValue(value)
    const valueX = 100
    const rowHeight = 5
    const lines = pdf.splitTextToSize(
      valueText,
      210 - valueX - marginRight,
    ) as string[]

    const height = Math.max(rowHeight, lines.length * rowHeight)

    ensureSpace(height + 2)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y - 4, valueX - marginLeft, height, "S")
    pdf.rect(valueX, y - 4, 210 - marginRight - valueX, height, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    pdf.text(label, marginLeft + 2, y)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    pdf.text(lines, valueX + 2, y)

    y += height
  }

  function addParagraphBox(text: string) {
    const lines = pdf.splitTextToSize(text || "-", contentWidth - 4) as string[]
    const lineHeight = 5
    const height = Math.max(8, lines.length * lineHeight + 4)

    ensureSpace(height + 2)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y - 4, contentWidth, height, "S")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")
    pdf.text(lines, marginLeft + 2, y)

    y += height + 2
  }

  function addIqHeader() {
    const labelWidth = 78
    const valueWidth = contentWidth - labelWidth

    ensureSpace(9)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y - 4, labelWidth, 7, "S")
    pdf.rect(marginLeft + labelWidth, y - 4, valueWidth, 7, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    pdf.text("Indicadores", marginLeft + labelWidth / 2, y, {
      align: "center",
    })
    pdf.text("Avaliação", marginLeft + labelWidth + valueWidth / 2, y, {
      align: "center",
    })

    y += 7
  }

  function addIqRow(label: string, value: string) {
    const labelWidth = 78
    const valueWidth = contentWidth - labelWidth

    ensureSpace(9)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.15)
    pdf.rect(marginLeft, y - 4, labelWidth, 7, "S")
    pdf.rect(marginLeft + labelWidth, y - 4, valueWidth, 7, "S")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9.5)
    setTextColor(pdf, "dark")
    pdf.text(label, marginLeft + 2, y)
    pdf.text(value, marginLeft + labelWidth + valueWidth / 2, y, {
      align: "center",
    })

    y += 7
  }

  function addLongTopic(title: string, text: string) {
    const cleanText = text?.trim() || "Não informado."
    const paragraphs = cleanText.split(/\n+/).filter(Boolean)

    const firstParagraphLines = pdf.splitTextToSize(
      paragraphs[0] ?? "Não informado.",
      contentWidth,
    ) as string[]

    const minimumBlockHeight = 12 + Math.min(firstParagraphLines.length, 3) * 5

    if (y + minimumBlockHeight > bottomLimit) {
      addNewContentPage()
    }

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    setTextColor(pdf, "dark")
    pdf.text(title, marginLeft, y)

    y += 8

    for (const paragraph of paragraphs) {
      addWrappedText(paragraph, marginLeft, contentWidth, {
        fontSize: 10,
        lineHeight: 5,
        color: "dark",
      })

      y += 4
    }

    y += 2
  }

  startPage({ showTitle: true })

  addSectionTitle("1. DADOS GERAIS")
  addInfoRow("Revisor:", item.avaliador_nome ?? "Não informado")
  addInfoRow("Colaborador:", item.colaborador_nome ?? "Não informado")
  addInfoRow("Equipe:", item.equipe_colaborador ?? "Não informado")
  addInfoRow("Projeto:", codigo.projetoCodigo)
  addInfoRow("Produto:", item.entrega_avaliada ?? "Não informado")
  addInfoRow(
    "Data da entrega:",
    formatDateRelatorioIndicador(item.data_entrega),
  )
  addInfoRow(
    "Data da revisão:",
    formatDateRelatorioIndicador(item.data_revisao),
  )

  addSectionTitle("2. INDICADOR DE ESFORÇO (IES)")
  addParagraphBox(getDescricaoIES(item))

  addSectionTitle("3. INDICADOR DE PRAZO (IP)")
  addParagraphBox(getDescricaoIP(item))

  addSectionTitle("4. INDICADOR DE QUALIDADE (IQ)")
  addIqHeader()
  addIqRow(
    "1. Clareza e estrutura:",
    formatNumberRelatorioIndicador(item.clareza_estrutura),
  )
  addIqRow(
    "2. Profundidade e rigor:",
    formatNumberRelatorioIndicador(item.profundidade_rigor),
  )
  addIqRow(
    "3. Alinhamento à demanda do cliente:",
    formatNumberRelatorioIndicador(item.alinhamento_demanda),
  )
  addIqRow(
    "4. Forma e profissionalismo:",
    formatNumberRelatorioIndicador(item.forma_profissionalismo),
  )

  y += 4

  addLongTopic("5. Pontos fracos:", item.pontos_fracos ?? "")
  addLongTopic("6. Pontos fortes:", item.pontos_fortes ?? "")

  ensureSpace(16)
  y += 3

  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.15)
  pdf.rect(marginLeft, y - 4, 78, 7, "S")
  pdf.rect(marginLeft + 78, y - 4, contentWidth - 78, 7, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  setTextColor(pdf, "dark")
  pdf.text("IQ MÉDIO:", marginLeft + 2, y)
  pdf.text(
    formatNumberRelatorioIndicador(item.iq),
    marginLeft + 78 + (contentWidth - 78) / 2,
    y,
    {
      align: "center",
    },
  )

  drawPageNumbers(pdf)

  return pdf
}