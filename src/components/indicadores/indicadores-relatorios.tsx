"use client"

import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import {
  Download,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { getRelatoriosEntregasIndicadores } from "@/app/actions/indicadores"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RelatorioEntrega = {
  id: string
  created_at: string
  numero_relatorio: number
  codigo_relatorio_base: string
  codigo_relatorio_arquivo: string
  codigo_revisao_titulo: string
  avaliador_nome: string | null
  colaborador_id: string
  colaborador_nome: string
  equipe_colaborador: string
  codigo_projeto: string
  projeto_nome: string
  entrega_avaliada: string
  data_entrega: string
  data_revisao: string
  ies_aprovado_primeira: boolean
  ip_no_prazo: boolean
  clareza_estrutura: number
  profundidade_rigor: number
  alinhamento_demanda: number
  forma_profissionalismo: number
  iq: number
  pontos_fortes: string | null
  pontos_fracos: string | null
  comentario_geral: string | null
}

type FiltrosRelatorios = {
  busca: string
  projeto: string
  equipe: string
  status: string
}

const PAGE = {
  width: 210,
  height: 297,
  marginX: 28,
  tableW: 154,
  contentTop: 46,
  contentBottom: 276,
}

const BLUE = {
  dark: [17, 54, 111] as const,
  mid: [46, 104, 168] as const,
  light: [123, 167, 205] as const,
}
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

function getStatusRelatorio(item: RelatorioEntrega) {
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

function getStatusClass(status: string) {
  if (status === "OK") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }

  if (status === "Atenção") {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }

  return "bg-rose-50 text-rose-700 border-rose-200"
}

function normalizarTexto(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
}

async function loadImageAsDataUrl(src: string) {
  try {
    const response = await fetch(src)

    if (!response.ok) return null

    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function setBlack(pdf: jsPDF) {
  pdf.setTextColor(0, 0, 0)
}

function setBlue(pdf: jsPDF) {
  pdf.setTextColor(BLUE.dark[0], BLUE.dark[1], BLUE.dark[2])
}

function drawParallelogram(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  skew: number,
  color: readonly [number, number, number],
) {
  pdf.setFillColor(color[0], color[1], color[2])

  pdf.triangle(x + skew, y, x + width + skew, y, x + width, y + height, "F")
  pdf.triangle(x + skew, y, x, y + height, x + width, y + height, "F")
}

function drawHeader(pdf: jsPDF, logoDataUrl: string | null) {
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", 21, 8, 28, 13)
  } else {
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(11)
    setBlue(pdf)
    pdf.text("EC projetos", 21, 17)
  }

  drawParallelogram(pdf, 62, 8, 17, 15, 7, BLUE.dark)
  drawParallelogram(pdf, 81, 8, 17, 15, 7, BLUE.mid)
  drawParallelogram(pdf, 100, 8, 17, 15, 7, BLUE.light)

  pdf.setFillColor(BLUE.light[0], BLUE.light[1], BLUE.light[2])
  pdf.rect(118, 8, 74, 15, "F")
}

function drawFooter(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages()

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)

    pdf.setFillColor(BLUE.dark[0], BLUE.dark[1], BLUE.dark[2])
    pdf.rect(0, 291, 210, 2.4, "F")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(70, 86, 110)
    pdf.text(String(page), 179, 283)
  }
}

function addPage(pdf: jsPDF, logoDataUrl: string | null) {
  pdf.addPage()
  drawHeader(pdf, logoDataUrl)
  return 42
}

function ensureSpace(
  pdf: jsPDF,
  y: number,
  neededHeight: number,
  logoDataUrl: string | null,
) {
  if (y + neededHeight <= PAGE.contentBottom) {
    return y
  }

  return addPage(pdf, logoDataUrl)
}

function drawSectionTitle(
  pdf: jsPDF,
  number: string,
  title: string,
  y: number,
) {
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(12.4)
  setBlue(pdf)
  pdf.text(`${number}. ${title}`, PAGE.marginX, y)
}

function drawCell(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options?: {
    bold?: boolean
    align?: "left" | "center"
    fontSize?: number
  },
) {
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.12)
  pdf.rect(x, y, width, height)

  pdf.setFont("helvetica", options?.bold ? "bold" : "normal")
  pdf.setFontSize(options?.fontSize ?? 8.1)
  setBlack(pdf)

  const align = options?.align ?? "left"
  const textX = align === "center" ? x + width / 2 : x + 1.8
  const lines = pdf.splitTextToSize(text || "-", width - 3.5)

  pdf.text(lines.slice(0, 2), textX, y + 3.9, { align })
}

function drawHeaderRow(pdf: jsPDF, y: number) {
  const x = PAGE.marginX
  const colW = PAGE.tableW / 2
  const rowH = 6.6

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8.8)

  drawCell(pdf, x, y, colW, rowH, "Indicadores", {
    bold: true,
    align: "center",
    fontSize: 8.8,
  })
  drawCell(pdf, x + colW, y, colW, rowH, "Avaliação", {
    bold: true,
    align: "center",
    fontSize: 8.8,
  })

  return y + rowH
}

function drawSimpleBox(
  pdf: jsPDF,
  text: string,
  y: number,
  logoDataUrl: string | null,
) {
  const x = PAGE.marginX
  const width = PAGE.tableW
  const lines = pdf.splitTextToSize(text || "Não informado.", width - 4)
  const height = Math.max(7, 3.8 + lines.length * 3.7)

  y = ensureSpace(pdf, y, height + 4, logoDataUrl)

  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.12)
  pdf.rect(x, y, width, height)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8.2)
  setBlack(pdf)
  pdf.text(lines, x + 2, y + 4.5)

  return y + height
}

function drawFullWidthTextRow(
  pdf: jsPDF,
  label: string,
  value: string | null,
  y: number,
  logoDataUrl: string | null,
  showTableHeaderOnNewPage = true,
) {
  const x = PAGE.marginX
  const width = PAGE.tableW
  const text = value?.trim() || "Não informado."
  const lines = pdf.splitTextToSize(text, width - 4)
  const labelH = 5.7
  const lineH = 3.85

  y = ensureSpace(pdf, y, labelH + 12, logoDataUrl)

  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.12)
  pdf.rect(x, y, width, labelH)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8.1)
  setBlack(pdf)
  pdf.text(label, x + 2, y + 4)

  y += labelH

  let currentLines = [...lines]

  while (currentLines.length) {
    const availableHeight = PAGE.contentBottom - y
    const maxLines = Math.max(1, Math.floor((availableHeight - 4) / lineH))
    const linesForPage = currentLines.slice(0, maxLines)
    currentLines = currentLines.slice(maxLines)

    const boxHeight = Math.max(8, 3.8 + linesForPage.length * lineH)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.12)
    pdf.rect(x, y, width, boxHeight)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8.1)
    setBlack(pdf)
    pdf.text(linesForPage, x + 2, y + 4.6)

    y += boxHeight

    if (currentLines.length) {
      y = addPage(pdf, logoDataUrl)

      if (showTableHeaderOnNewPage) {
        y = drawHeaderRow(pdf, y)
      }
    }
  }

  return y
}

async function gerarPdfModeloOficial(item: RelatorioEntrega) {
  const pdf = new jsPDF("p", "mm", "a4")
  const logoDataUrl = await loadImageAsDataUrl("/ec-projetos-logo.png")

  pdf.setProperties({
    title: item.codigo_relatorio_arquivo,
    subject: "Relatório de Revisão Técnica",
    author: "Sistema Interno EC Projetos",
  })

  const margemX = 27
  const larguraTabela = 156
  const limiteInferior = 276
  const azulEscuro: [number, number, number] = [18, 57, 112]
  const azulMedio: [number, number, number] = [47, 104, 166]
  const azulClaro: [number, number, number] = [123, 167, 205]

  function setAzul() {
    pdf.setTextColor(azulEscuro[0], azulEscuro[1], azulEscuro[2])
  }

  function setPreto() {
    pdf.setTextColor(0, 0, 0)
  }

  function header() {
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", 22, 10.5, 28, 9.8)
    } else {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      setAzul()
      pdf.text("EC projetos", 22, 17)
    }
  
    pdf.setFillColor(azulEscuro[0], azulEscuro[1], azulEscuro[2])
    pdf.triangle(62, 8, 78, 8, 70, 24, "F")
    pdf.triangle(62, 8, 54, 24, 70, 24, "F")
  
    pdf.setFillColor(azulMedio[0], azulMedio[1], azulMedio[2])
    pdf.triangle(81, 8, 97, 8, 89, 24, "F")
    pdf.triangle(81, 8, 73, 24, 89, 24, "F")
  
    pdf.setFillColor(azulClaro[0], azulClaro[1], azulClaro[2])
    pdf.triangle(100, 8, 116, 8, 108, 24, "F")
    pdf.triangle(100, 8, 92, 24, 108, 24, "F")
  
    pdf.setFillColor(azulClaro[0], azulClaro[1], azulClaro[2])
    pdf.rect(116, 8, 78, 16, "F")
  }

  function footer() {
    const totalPaginas = pdf.getNumberOfPages()

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      pdf.setPage(pagina)

      pdf.setFillColor(azulEscuro[0], azulEscuro[1], azulEscuro[2])
      pdf.rect(0, 291, 210, 2.4, "F")

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(70, 86, 110)
      pdf.text(String(pagina), 178, 283)
    }
  }

  function novaPagina() {
    pdf.addPage()
    header()
    return 42
  }

  function garantirEspaco(y: number, alturaNecessaria: number) {
    if (y + alturaNecessaria <= limiteInferior) {
      return y
    }

    return novaPagina()
  }

  function tituloSecao(numero: string, titulo: string, y: number) {
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12.5)
    setAzul()
    pdf.text(`${numero}. ${titulo}`, margemX, y)
  }

  function celula(
    x: number,
    y: number,
    largura: number,
    altura: number,
    texto: string,
    opcoes?: {
      bold?: boolean
      align?: "left" | "center"
      fontSize?: number
    },
  ) {
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.12)
    pdf.rect(x, y, largura, altura)

    pdf.setFont("helvetica", opcoes?.bold ? "bold" : "normal")
    pdf.setFontSize(opcoes?.fontSize ?? 8.1)
    setPreto()

    const align = opcoes?.align ?? "left"
    const textX = align === "center" ? x + largura / 2 : x + 1.8
    const linhas = pdf.splitTextToSize(texto || "-", largura - 3.6)

    pdf.text(linhas.slice(0, 2), textX, y + 3.9, { align })
  }

  function linhaCabecalhoTabela(y: number) {
    const larguraColuna = larguraTabela / 2
    const alturaLinha = 5.8

    celula(margemX, y, larguraColuna, alturaLinha, "Indicadores", {
      bold: true,
      align: "center",
      fontSize: 8.4,
    })

    celula(
      margemX + larguraColuna,
      y,
      larguraColuna,
      alturaLinha,
      "Avaliação",
      {
        bold: true,
        align: "center",
        fontSize: 8.4,
      },
    )

    return y + alturaLinha
  }

  function caixaTextoSimples(texto: string, y: number) {
    const linhas = pdf.splitTextToSize(
      texto || "Não informado.",
      larguraTabela - 4,
    )
    const altura = Math.max(7.5, 4 + linhas.length * 3.8)

    y = garantirEspaco(y, altura + 4)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.12)
    pdf.rect(margemX, y, larguraTabela, altura)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8.3)
    setPreto()
    pdf.text(linhas, margemX + 2, y + 4.6)

    return y + altura
  }

  function linhaTextoGrande(label: string, valor: string | null, y: number) {
    const texto = valor?.trim() || "Não informado."
    const linhas = pdf.splitTextToSize(texto, larguraTabela - 4)
    const alturaLabel = 5.7
    const alturaLinha = 3.85

    y = garantirEspaco(y, alturaLabel + 12)

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.12)
    pdf.rect(margemX, y, larguraTabela, alturaLabel)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8.1)
    setPreto()
    pdf.text(label, margemX + 2, y + 4)

    y += alturaLabel

    let linhasRestantes = [...linhas]

    while (linhasRestantes.length) {
      const alturaDisponivel = limiteInferior - y
      const maxLinhas = Math.max(
        1,
        Math.floor((alturaDisponivel - 4) / alturaLinha),
      )
      const linhasDaPagina = linhasRestantes.slice(0, maxLinhas)

      linhasRestantes = linhasRestantes.slice(maxLinhas)

      const alturaCaixa = Math.max(8, 3.8 + linhasDaPagina.length * alturaLinha)

      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.12)
      pdf.rect(margemX, y, larguraTabela, alturaCaixa)

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8.1)
      setPreto()
      pdf.text(linhasDaPagina, margemX + 2, y + 4.6)

      y += alturaCaixa

      if (linhasRestantes.length) {
        y = novaPagina()
        y = linhaCabecalhoTabela(y)
      }
    }

    return y
  }

  header()

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11.8)
  setAzul()
  pdf.text(`REVISÃO TÉCNICA - ${item.codigo_revisao_titulo}`, 105, 36, {
    align: "center",
  })

  let y = 48

  tituloSecao("1", "DADOS GERAIS", y)
  y += 8.5

  const labelW = 74
  const valueW = 82
  const rowH = 5.3

  const dadosGerais = [
    ["Revisor:", item.avaliador_nome ?? "Não informado"],
    ["Colaborador:", item.colaborador_nome],
    ["Equipe:", item.equipe_colaborador],
    ["Projeto:", item.codigo_projeto],
    ["Produto:", item.entrega_avaliada],
    ["Data da entrega:", formatDate(item.data_entrega)],
    ["Data da revisão:", formatDate(item.data_revisao)],
  ]

  dadosGerais.forEach(([label, value]) => {
    celula(margemX, y, labelW, rowH, label, {
      bold: true,
      fontSize: 8.1,
    })

    celula(margemX + labelW, y, valueW, rowH, value, {
      fontSize: 8.1,
    })

    y += rowH
  })

  y += 12

  tituloSecao("2", "INDICADOR DE ESFORÇO (IES)", y)
  y += 5.3

  y = caixaTextoSimples(
    item.ies_aprovado_primeira
      ? "Aprovado, pois foi aprovado na primeira revisão."
      : "Não aprovado na primeira revisão, pois haverá necessidade de ajustes significativos.",
    y,
  )

  y += 11.5

  tituloSecao("3", "INDICADOR DE PRAZO (IP)", y)
  y += 5.3

  y = caixaTextoSimples(
    item.ip_no_prazo
      ? "Aprovado, pois foi entregue no prazo interno acordado com o gestor."
      : "Não aprovado, pois não foi entregue no prazo interno acordado com o gestor.",
    y,
  )

  y += 11.5

  tituloSecao("4", "INDICADOR DE QUALIDADE (IQ)", y)
  y += 6.2

  y = linhaCabecalhoTabela(y)

  const larguraColuna = larguraTabela / 2
  const qRowH = 5.6

  const indicadores = [
    ["1. Clareza e estrutura:", formatNumber(item.clareza_estrutura)],
    ["2. Profundidade e rigor:", formatNumber(item.profundidade_rigor)],
    [
      "3. Alinhamento à demanda do cliente:",
      formatNumber(item.alinhamento_demanda),
    ],
    ["4. Forma e profissionalismo:", formatNumber(item.forma_profissionalismo)],
  ]

  indicadores.forEach(([label, value]) => {
    y = garantirEspaco(y, qRowH)

    celula(margemX, y, larguraColuna, qRowH, label, {
      fontSize: 8,
    })

    celula(margemX + larguraColuna, y, larguraColuna, qRowH, value, {
      align: "center",
      fontSize: 8,
    })

    y += qRowH
  })

  y = linhaTextoGrande("5. Pontos fracos:", item.pontos_fracos, y)
  y = linhaTextoGrande("6. Pontos fortes:", item.pontos_fortes, y)

  y = garantirEspaco(y, qRowH)

  celula(margemX, y, larguraColuna, qRowH, "IQ MÉDIO:", {
    bold: true,
    fontSize: 8.3,
  })

  celula(
    margemX + larguraColuna,
    y,
    larguraColuna,
    qRowH,
    formatNumber(item.iq),
    {
      bold: true,
      align: "center",
      fontSize: 8.3,
    },
  )

  footer()

  return pdf
}

export default function IndicadoresRelatorios() {
  const [relatorios, setRelatorios] = useState<RelatorioEntrega[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosRelatorios>({
    busca: "",
    projeto: "",
    equipe: "",
    status: "",
  })

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

  const projetos = useMemo(() => {
    return Array.from(new Set(relatorios.map((item) => item.codigo_projeto)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [relatorios])

  const equipes = useMemo(() => {
    return Array.from(
      new Set(relatorios.map((item) => item.equipe_colaborador)),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [relatorios])

  const relatoriosFiltrados = useMemo(() => {
    const busca = normalizarTexto(filtros.busca)

    return relatorios.filter((item) => {
      const status = getStatusRelatorio(item)

      const matchesBusca =
        !busca ||
        normalizarTexto(item.codigo_relatorio_arquivo).includes(busca) ||
        normalizarTexto(item.colaborador_nome).includes(busca) ||
        normalizarTexto(item.entrega_avaliada).includes(busca) ||
        normalizarTexto(item.codigo_projeto).includes(busca)

      const matchesProjeto =
        !filtros.projeto || item.codigo_projeto === filtros.projeto

      const matchesEquipe =
        !filtros.equipe || item.equipe_colaborador === filtros.equipe

      const matchesStatus = !filtros.status || status === filtros.status

      return matchesBusca && matchesProjeto && matchesEquipe && matchesStatus
    })
  }, [relatorios, filtros])

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

  function atualizarFiltro<K extends keyof FiltrosRelatorios>(
    campo: K,
    valor: FiltrosRelatorios[K],
  ) {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  function limparFiltros() {
    setFiltros({
      busca: "",
      projeto: "",
      equipe: "",
      status: "",
    })
  }

  async function baixarPdf(item: RelatorioEntrega) {
    try {
      setGerandoPdfId(item.id)

      const pdf = await gerarPdfModeloOficial(item)
      const fileName = sanitizeFileName(item.codigo_relatorio_arquivo)

      pdf.save(`${fileName}.pdf`)

      toast.success("PDF gerado com sucesso.")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível gerar o PDF.")
    } finally {
      setGerandoPdfId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Relatórios de Revisão Técnica
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Relatórios por entrega no padrão EC-REV, com numeração, projeto,
              revisão e download em PDF.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={limparFiltros}
            className="w-fit rounded-xl"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Relatórios</p>
            <p className="mt-1 text-2xl font-bold">{totalRelatorios}</p>
          </div>

          <div className="rounded-xl border bg-emerald-50 p-4 text-emerald-700">
            <p className="text-sm">OK</p>
            <p className="mt-1 text-2xl font-bold">{totalOk}</p>
          </div>

          <div className="rounded-xl border bg-amber-50 p-4 text-amber-700">
            <p className="text-sm">Atenção</p>
            <p className="mt-1 text-2xl font-bold">{totalAtencao}</p>
          </div>

          <div className="rounded-xl border bg-rose-50 p-4 text-rose-700">
            <p className="text-sm">Crítico</p>
            <p className="mt-1 text-2xl font-bold">{totalCritico}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr]">
          <div className="space-y-2">
            <Label htmlFor="busca_relatorio">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca_relatorio"
                value={filtros.busca}
                onChange={(event) =>
                  atualizarFiltro("busca", event.target.value)
                }
                placeholder="Código, colaborador, produto ou projeto"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_projeto_relatorio">Projeto</Label>
            <select
              id="filtro_projeto_relatorio"
              value={filtros.projeto}
              onChange={(event) =>
                atualizarFiltro("projeto", event.target.value)
              }
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {projetos.map((projeto) => (
                <option key={projeto} value={projeto}>
                  {projeto}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_equipe_relatorio">Equipe</Label>
            <select
              id="filtro_equipe_relatorio"
              value={filtros.equipe}
              onChange={(event) =>
                atualizarFiltro("equipe", event.target.value)
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

          <div className="space-y-2">
            <Label htmlFor="filtro_status_relatorio">Status</Label>
            <select
              id="filtro_status_relatorio"
              value={filtros.status}
              onChange={(event) =>
                atualizarFiltro("status", event.target.value)
              }
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="OK">OK</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando relatórios...
          </div>
        ) : relatoriosFiltrados.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Nenhum relatório encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="max-h-[680px] overflow-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Produto</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Projeto
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Entrega
                  </th>
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
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-blue-700" />
                          <div>
                            <p className="font-semibold">
                              {item.codigo_relatorio_arquivo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.codigo_revisao_titulo}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[280px] font-medium">
                          {item.entrega_avaliada}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium">{item.colaborador_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.equipe_colaborador}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center font-medium">
                        {item.codigo_projeto}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {formatDate(item.data_entrega)}
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
