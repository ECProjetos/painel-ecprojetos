"use client"

import { FileDown } from "lucide-react"
import { jsPDF } from "jspdf"

import type { PortfolioCase } from "@/app/actions/portfolio"

import { Button } from "@/components/ui/button"

import {
  drawCommercialContinuationHeader,
  drawCommercialFooter,
  drawCommercialHeader,
  EC_PDF_COLORS,
  loadPdfImage,
} from "@/lib/pdf/ec-pdf-branding"

type PortfolioPdfButtonProps = {
  project: PortfolioCase
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
}

function formatDepartmentName(name: string) {
  return name
    .replace(/^Departamento de /i, "")
    .replace(/^Departamento da /i, "")
    .replace(/^Departamento do /i, "")
    .replace(/^Departamento /i, "")
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

function currencyPrefix(currency: string) {
  if (currency === "BRL") {
    return "R$"
  }

  if (currency === "USD") {
    return "US$"
  }

  if (currency === "EUR") {
    return "€"
  }

  return currency
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatCommercialCurrency(value: number, currency: string) {
  const prefix = currencyPrefix(currency)

  const absolute = Math.abs(value)

  if (absolute >= 1_000_000_000) {
    const amount = value / 1_000_000_000

    return `${prefix} ${compactNumber(amount)} ${
      Math.abs(amount) === 1 ? "bilhão" : "bilhões"
    }`
  }

  if (absolute >= 1_000_000) {
    const amount = value / 1_000_000

    return `${prefix} ${compactNumber(amount)} ${
      Math.abs(amount) === 1 ? "milhão" : "milhões"
    }`
  }

  if (absolute >= 1_000) {
    return `${prefix} ${compactNumber(value / 1_000)} mil`
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function setFillColor(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setFillColor(color[0], color[1], color[2])
}

function setTextColor(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2])
}

function setDrawColor(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setDrawColor(color[0], color[1], color[2])
}

export function PortfolioPdfButton({ project }: PortfolioPdfButtonProps) {
  async function generatePdf() {
    if (!project.portfolio.allow_external_export) {
      const proceed = window.confirm(
        "Este projeto não está marcado como autorizado para exportação externa. Deseja gerar o PDF mesmo assim para uso interno?",
      )

      if (!proceed) {
        return
      }
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = pdf.internal.pageSize.getWidth()

    const pageHeight = pdf.internal.pageSize.getHeight()

    const marginX = 15

    const contentWidth = pageWidth - marginX * 2

    const footerTop = pageHeight - 12

    /**
     * O arquivo atual possui o símbolo EC.
     * O helper adiciona "projetos" vetorialmente.
     */
    const logo = await loadPdfImage("/ec-projetos-logo.png")

    let y = drawCommercialHeader(pdf, logo)

    const assuntos = project.tags.filter((tag) => tag.category === "assunto")

    const setores = project.tags.filter((tag) => tag.category === "setor")

    const areas = project.departments.map((department) =>
      formatDepartmentName(department.name),
    )

    function addContinuationPage() {
      pdf.addPage()

      y = drawCommercialContinuationHeader(pdf, logo)
    }

    function ensureSpace(requiredHeight: number) {
      if (y + requiredHeight > footerTop) {
        addContinuationPage()
      }
    }

    // =====================================================
    // HERO
    // =====================================================

    const heroY = y

    const titleMaxWidth = 118

    pdf.setFont("helvetica", "bold")

    pdf.setFontSize(20)

    const titleLines = pdf.splitTextToSize(
      project.name,
      titleMaxWidth,
    ) as string[]

    pdf.setFont("helvetica", "normal")

    pdf.setFontSize(8.5)

    const descriptionLines = project.description
      ? (pdf.splitTextToSize(project.description, titleMaxWidth) as string[])
      : []

    const heroHeight = Math.max(
      44,
      24 + titleLines.length * 7.5 + Math.min(descriptionLines.length, 3) * 4.2,
    )

    setFillColor(pdf, EC_PDF_COLORS.navy)

    pdf.rect(0, heroY, pageWidth, heroHeight, "F")

    // Grafismo do hero
    setFillColor(pdf, EC_PDF_COLORS.blue)

    pdf.lines(
      [
        [51, 0],
        [-22, heroHeight],
        [-51, 0],
        [22, -heroHeight],
      ],
      pageWidth - 51,
      heroY,
      [1, 1],
      "F",
      true,
    )

    setFillColor(pdf, EC_PDF_COLORS.mediumBlue)

    pdf.lines(
      [
        [34, 0],
        [-18, heroHeight],
        [-34, 0],
        [18, -heroHeight],
      ],
      pageWidth - 34,
      heroY,
      [1, 1],
      "F",
      true,
    )

    setFillColor(pdf, EC_PDF_COLORS.lightBlue)

    pdf.lines(
      [
        [18, 0],
        [-10, heroHeight],
        [-18, 0],
        [10, -heroHeight],
      ],
      pageWidth - 18,
      heroY,
      [1, 1],
      "F",
      true,
    )

    // Badge
    setFillColor(pdf, EC_PDF_COLORS.blue)

    pdf.roundedRect(marginX, heroY + 6, 27, 6, 1.3, 1.3, "F")

    pdf.setFont("helvetica", "bold")

    pdf.setFontSize(6)

    setTextColor(pdf, EC_PDF_COLORS.white)

    pdf.text("CASE DE SUCESSO", marginX + 2.6, heroY + 10)

    let heroTextY = heroY + 19

    if (project.code) {
      pdf.setFont("helvetica", "bold")

      pdf.setFontSize(8)

      setTextColor(pdf, EC_PDF_COLORS.white)

      pdf.text(project.code, marginX, heroTextY)

      heroTextY += 6
    }

    pdf.setFont("helvetica", "bold")

    pdf.setFontSize(20)

    setTextColor(pdf, EC_PDF_COLORS.white)

    pdf.text(titleLines, marginX, heroTextY)

    heroTextY += titleLines.length * 7.2 + 2.5

    if (descriptionLines.length > 0) {
      pdf.setFont("helvetica", "normal")

      pdf.setFontSize(8)

      setTextColor(pdf, [226, 235, 245])

      pdf.text(descriptionLines.slice(0, 3), marginX, heroTextY, {
        lineHeightFactor: 1.25,
      })
    }

    y = heroY + heroHeight + 5

    // =====================================================
    // NÚMEROS PRINCIPAIS
    // =====================================================

    const metrics: {
      label: string
      value: string
    }[] = []

    if (project.portfolio.completion_date) {
      metrics.push({
        label: "Conclusão",

        value: formatDate(project.portfolio.completion_date),
      })
    }

    if (project.estimated_hours !== null) {
      metrics.push({
        label: "Horas estimadas",

        value: `${project.estimated_hours.toLocaleString("pt-BR")} h`,
      })
    }

    if (
      project.portfolio.show_values_in_pdf &&
      project.portfolio.projected_demand !== null
    ) {
      const projectedDemandValue =
        project.portfolio.projected_demand.toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })

      metrics.push({
        label: "Demanda projetada",

        value: project.portfolio.projected_demand_unit
          ? `${projectedDemandValue} ${project.portfolio.projected_demand_unit}`
          : projectedDemandValue,
      })
    }

    if (
      project.portfolio.show_values_in_pdf &&
      project.portfolio.capex !== null
    ) {
      metrics.push({
        label: "CAPEX",

        value: formatCommercialCurrency(
          project.portfolio.capex,

          project.portfolio.currency,
        ),
      })
    }

    if (metrics.length > 0) {
      const gap = 3

      const metricWidth =
        (contentWidth - gap * (metrics.length - 1)) / metrics.length

      const metricHeight = 18

      ensureSpace(metricHeight + 4)

      metrics.forEach((metric, index) => {
        const x = marginX + index * (metricWidth + gap)

        setFillColor(pdf, EC_PDF_COLORS.lightBackground)

        setDrawColor(pdf, EC_PDF_COLORS.border)

        pdf.setLineWidth(0.2)

        pdf.roundedRect(x, y, metricWidth, metricHeight, 1.8, 1.8, "FD")

        // detalhe superior
        setFillColor(
          pdf,
          index === 0
            ? EC_PDF_COLORS.navy
            : index === 1
              ? EC_PDF_COLORS.blue
              : index === 2
                ? EC_PDF_COLORS.mediumBlue
                : EC_PDF_COLORS.lightBlue,
        )

        pdf.rect(x, y, metricWidth, 1.3, "F")

        pdf.setFont("helvetica", "normal")

        pdf.setFontSize(5.8)

        setTextColor(pdf, EC_PDF_COLORS.muted)

        pdf.text(metric.label, x + 3, y + 6)

        pdf.setFont("helvetica", "bold")

        pdf.setFontSize(metric.value.length > 17 ? 7.2 : 8.3)

        setTextColor(pdf, EC_PDF_COLORS.text)

        const valueLines = pdf.splitTextToSize(
          metric.value,
          metricWidth - 6,
        ) as string[]

        pdf.text(valueLines.slice(0, 2), x + 3, y + 12, {
          lineHeightFactor: 1.15,
        })
      })

      y += metricHeight + 5
    }

    // =====================================================
    // CLASSIFICAÇÕES
    // =====================================================

    const classificationGroups = [
      {
        title: "ÁREAS",

        values: areas,
      },

      {
        title: "ASSUNTOS",

        values: assuntos.map((tag) => tag.name),
      },

      {
        title: "SETORES",

        values: setores.map((tag) => tag.name),
      },
    ]

    const classificationGap = 5

    const classificationWidth = (contentWidth - classificationGap * 2) / 3

    pdf.setFont("helvetica", "normal")

    pdf.setFontSize(7)

    const classificationLines = classificationGroups.map((group) => {
      const text =
        group.values.length > 0 ? group.values.join(" • ") : "Não informado"

      return pdf.splitTextToSize(text, classificationWidth - 7) as string[]
    })

    const maxClassificationLines = Math.max(
      ...classificationLines.map((lines) => lines.length),
    )

    const classificationHeight = Math.max(20, 13 + maxClassificationLines * 3.8)

    ensureSpace(classificationHeight + 5)

    setFillColor(pdf, EC_PDF_COLORS.white)

    setDrawColor(pdf, EC_PDF_COLORS.border)

    pdf.roundedRect(marginX, y, contentWidth, classificationHeight, 2, 2, "FD")

    classificationGroups.forEach((group, index) => {
      const x = marginX + index * (classificationWidth + classificationGap)

      pdf.setFont("helvetica", "bold")

      pdf.setFontSize(6.5)

      setTextColor(pdf, EC_PDF_COLORS.navy)

      pdf.text(group.title, x + 3, y + 6)

      pdf.setFont("helvetica", "normal")

      pdf.setFontSize(7)

      setTextColor(pdf, EC_PDF_COLORS.text)

      pdf.text(classificationLines[index], x + 3, y + 12, {
        lineHeightFactor: 1.25,
      })

      if (index < 2) {
        const dividerX = x + classificationWidth + classificationGap / 2

        setDrawColor(pdf, EC_PDF_COLORS.border)

        pdf.line(dividerX, y + 4, dividerX, y + classificationHeight - 4)
      }
    })

    y += classificationHeight + 5

    // =====================================================
    // CARDS DE CONTEÚDO
    // =====================================================

    const bodyFontSize = 8
    const bodyLineHeight = 4
    const cardHeaderHeight = 14
    const minCardHeight = 22

    function getLines(text: string, width: number) {
      pdf.setFont("helvetica", "normal")

      pdf.setFontSize(bodyFontSize)

      return pdf.splitTextToSize(text, width - 10) as string[]
    }

    function calculateCardHeight(text: string, width: number) {
      const lines = getLines(text, width)

      return Math.max(
        minCardHeight,

        cardHeaderHeight + lines.length * bodyLineHeight + 3,
      )
    }

    function drawCardLines(
      title: string,
      lines: string[],
      x: number,
      cardY: number,
      width: number,
      height: number,
      continuation = false,
    ) {
      setFillColor(pdf, EC_PDF_COLORS.white)

      setDrawColor(pdf, EC_PDF_COLORS.border)

      pdf.setLineWidth(0.2)

      pdf.roundedRect(x, cardY, width, height, 2, 2, "FD")

      // detalhe vertical
      setFillColor(pdf, EC_PDF_COLORS.blue)

      pdf.roundedRect(x + 4, cardY + 5, 2.2, 7, 0.6, 0.6, "F")

      pdf.setFont("helvetica", "bold")

      pdf.setFontSize(7.5)

      setTextColor(pdf, EC_PDF_COLORS.navy)

      pdf.text(
        continuation
          ? `${title.toUpperCase()} - CONTINUAÇÃO`
          : title.toUpperCase(),

        x + 9,
        cardY + 9,
      )

      pdf.setFont("helvetica", "normal")

      pdf.setFontSize(bodyFontSize)

      setTextColor(pdf, EC_PDF_COLORS.text)

      pdf.text(lines, x + 5, cardY + 16, {
        lineHeightFactor: 1.25,
      })
    }

    /**
     * Se um texto for grande demais para uma página,
     * ele é quebrado automaticamente.
     */
    function drawFullWidthSection(title: string, text: string | null) {
      if (!text) {
        return
      }

      const allLines = getLines(text, contentWidth)

      let remainingLines = [...allLines]

      let continuation = false

      while (remainingLines.length > 0) {
        if (y > footerTop - 25) {
          addContinuationPage()
        }

        const availableHeight = footerTop - y - 3

        const maximumLines = Math.max(
          1,
          Math.floor((availableHeight - cardHeaderHeight - 3) / bodyLineHeight),
        )

        if (maximumLines < 2) {
          addContinuationPage()
          continue
        }

        const chunk = remainingLines.splice(0, maximumLines)

        const height = Math.max(
          minCardHeight,

          cardHeaderHeight + chunk.length * bodyLineHeight + 3,
        )

        drawCardLines(
          title,
          chunk,
          marginX,
          y,
          contentWidth,
          height,
          continuation,
        )

        y += height + 5

        continuation = true
      }
    }

    function drawTwoColumnSections(
      left: {
        title: string
        text: string | null
      },
      right: {
        title: string
        text: string | null
      },
    ) {
      if (!left.text && !right.text) {
        return
      }

      if (!left.text) {
        drawFullWidthSection(right.title, right.text)
        return
      }

      if (!right.text) {
        drawFullWidthSection(left.title, left.text)
        return
      }

      const gap = 5

      const columnWidth = (contentWidth - gap) / 2

      const leftHeight = calculateCardHeight(left.text, columnWidth)

      const rightHeight = calculateCardHeight(right.text, columnWidth)

      const rowHeight = Math.max(leftHeight, rightHeight)

      /**
       * Se os textos forem grandes,
       * prefere uma coluna para preservar legibilidade.
       */
      if (rowHeight > 65) {
        drawFullWidthSection(left.title, left.text)

        drawFullWidthSection(right.title, right.text)

        return
      }

      ensureSpace(rowHeight + 5)

      drawCardLines(
        left.title,

        getLines(left.text, columnWidth),

        marginX,
        y,
        columnWidth,
        rowHeight,
      )

      drawCardLines(
        right.title,

        getLines(right.text, columnWidth),

        marginX + columnWidth + gap,

        y,
        columnWidth,
        rowHeight,
      )

      y += rowHeight + 5
    }

    // =====================================================
    // CONTEÚDO
    // =====================================================

    drawFullWidthSection(
      "Resumo executivo",

      project.portfolio.executive_summary,
    )

    drawTwoColumnSections(
      {
        title: "Desafio / contexto",

        text: project.portfolio.challenge,
      },

      {
        title: "Solução desenvolvida",

        text: project.portfolio.solution,
      },
    )

    drawTwoColumnSections(
      {
        title: "Resultados alcançados",

        text: project.portfolio.results,
      },

      {
        title: "Resultados quantitativos",

        text: project.portfolio.quantitative_results,
      },
    )

    // =====================================================
    // RODAPÉ
    // =====================================================

    const totalPages = pdf.getNumberOfPages()

    for (let page = 1; page <= totalPages; page++) {
      pdf.setPage(page)

      drawCommercialFooter(pdf, page, totalPages)
    }

    // =====================================================
    // DOWNLOAD
    // =====================================================

    const filename = ["portfolio", project.code, project.name]
      .filter(Boolean)
      .join("-")

    pdf.save(`${sanitizeFilename(filename)}.pdf`)
  }

  return (
    <Button type="button" onClick={generatePdf}>
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  )
}
