"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  getPortfolioProjectsForExport,
  type PortfolioExportProject,
} from "@/app/actions/portfolio"

const COLORS = {
  navy: [10, 46, 99] as [number, number, number],
  blue: [31, 78, 161] as [number, number, number],
  mediumBlue: [72, 117, 183] as [number, number, number],
  lightBlue: [114, 158, 200] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [218, 225, 234] as [number, number, number],
  background: [246, 248, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function formatDate(value: string | null) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency || "BRL"} ${value.toLocaleString("pt-BR")}`
  }
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null)
      }

      reader.onerror = () => reject(reader.error)

      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function getProjectSummary(project: PortfolioExportProject) {
  return (
    project.portfolio.executive_summary?.trim() ||
    project.description?.trim() ||
    "Projeto desenvolvido pela EC Projetos."
  )
}

export function PortfolioFullPdfButton() {
  const [loading, setLoading] = useState(false)

  async function generatePdf() {
    try {
      setLoading(true)

      const projects = await getPortfolioProjectsForExport()

      if (projects.length === 0) {
        toast.error(
          "Nenhum projeto está liberado para exportação externa no portfólio.",
        )

        return
      }

      const { jsPDF } = await import("jspdf")

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const marginX = 18
      const contentWidth = pageWidth - marginX * 2

      const template = await loadImageAsDataUrl("/modelo-pdf-fundo.png")

      function drawTemplate() {
        if (template) {
          pdf.addImage(
            template,
            "PNG",
            0,
            0,
            pageWidth,
            pageHeight,
          )

          return
        }

        pdf.setFillColor(...COLORS.white)
        pdf.rect(0, 0, pageWidth, pageHeight, "F")

        pdf.setFillColor(...COLORS.navy)
        pdf.rect(0, pageHeight - 4, pageWidth, 4, "F")
      }

      function drawPageTitle(title: string, subtitle?: string) {
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(16)
        pdf.setTextColor(...COLORS.navy)

        pdf.text(title, marginX, 35)

        if (subtitle) {
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(8)
          pdf.setTextColor(...COLORS.muted)

          pdf.text(subtitle, marginX, 42)
        }

        pdf.setFillColor(...COLORS.blue)
        pdf.rect(marginX, 47, 32, 1.5, "F")
      }

      // =====================================================
      // CAPA
      // =====================================================

      drawTemplate()

      pdf.setFillColor(...COLORS.navy)

      pdf.roundedRect(
        marginX,
        72,
        contentWidth,
        94,
        3,
        3,
        "F",
      )

      pdf.setFillColor(...COLORS.blue)

      pdf.rect(
        marginX,
        72,
        5,
        94,
        "F",
      )

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(...COLORS.lightBlue)

      pdf.text(
        "EC PROJETOS",
        marginX + 14,
        93,
      )

      pdf.setFontSize(26)
      pdf.setTextColor(...COLORS.white)

      pdf.text(
        ["PORTFÓLIO", "DE PROJETOS"],
        marginX + 14,
        108,
        {
          lineHeightFactor: 1.15,
        },
      )

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.setTextColor(220, 230, 242)

      const coverDescription = pdf.splitTextToSize(
        "Experiência, soluções e resultados desenvolvidos pela EC Projetos.",
        contentWidth - 34,
      ) as string[]

      pdf.text(
        coverDescription,
        marginX + 14,
        137,
        {
          lineHeightFactor: 1.3,
        },
      )

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...COLORS.white)

      pdf.text(
        `${projects.length} ${
          projects.length === 1 ? "projeto selecionado" : "projetos selecionados"
        }`,
        marginX + 14,
        157,
      )

      // =====================================================
      // VISÃO GERAL
      // =====================================================

      pdf.addPage()
      drawTemplate()

      drawPageTitle(
        "Portfólio de Projetos",
        "Projetos concluídos e autorizados para apresentação externa.",
      )

      const departmentNames = Array.from(
        new Set(
          projects.flatMap((project) =>
            project.departments.map((department) => department.name),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"))

      const assuntos = Array.from(
        new Set(
          projects.flatMap((project) =>
            project.tags
              .filter((tag) => tag.category === "assunto")
              .map((tag) => tag.name),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"))

      const setores = Array.from(
        new Set(
          projects.flatMap((project) =>
            project.tags
              .filter((tag) => tag.category === "setor")
              .map((tag) => tag.name),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"))

      const metrics = [
        {
          label: "PROJETOS",
          value: String(projects.length),
        },
        {
          label: "ÁREAS",
          value: String(departmentNames.length),
        },
        {
          label: "ASSUNTOS",
          value: String(assuntos.length),
        },
        {
          label: "SETORES",
          value: String(setores.length),
        },
      ]

      const metricGap = 4
      const metricWidth =
        (contentWidth - metricGap * (metrics.length - 1)) /
        metrics.length

      metrics.forEach((metric, index) => {
        const x =
          marginX +
          index * (metricWidth + metricGap)

        pdf.setFillColor(...COLORS.background)
        pdf.setDrawColor(...COLORS.border)

        pdf.roundedRect(
          x,
          58,
          metricWidth,
          25,
          2,
          2,
          "FD",
        )

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(15)
        pdf.setTextColor(...COLORS.navy)

        pdf.text(
          metric.value,
          x + 4,
          69,
        )

        pdf.setFontSize(6)
        pdf.setTextColor(...COLORS.muted)

        pdf.text(
          metric.label,
          x + 4,
          77,
        )
      })

      let overviewY = 97

      const overviewSections = [
        {
          title: "ÁREAS DE ATUAÇÃO",
          values: departmentNames,
        },
        {
          title: "ASSUNTOS",
          values: assuntos,
        },
        {
          title: "SETORES",
          values: setores,
        },
      ]

      for (const section of overviewSections) {
        if (section.values.length === 0) {
          continue
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(8)
        pdf.setTextColor(...COLORS.navy)

        pdf.text(
          section.title,
          marginX,
          overviewY,
        )

        overviewY += 6

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...COLORS.text)

        const lines = pdf.splitTextToSize(
          section.values.join(" • "),
          contentWidth,
        ) as string[]

        pdf.text(
          lines,
          marginX,
          overviewY,
          {
            lineHeightFactor: 1.35,
          },
        )

        overviewY += lines.length * 4.2 + 10
      }

      // =====================================================
      // PROJETOS
      // =====================================================

      pdf.addPage()
      drawTemplate()

      drawPageTitle(
        "Projetos Selecionados",
        "Experiências desenvolvidas pela EC Projetos.",
      )

      let y = 58

      function addProjectsPage() {
        pdf.addPage()
        drawTemplate()

        drawPageTitle(
          "Projetos Selecionados",
          "Experiências desenvolvidas pela EC Projetos.",
        )

        y = 58
      }

      projects.forEach((project, index) => {
        const summary = getProjectSummary(project)

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)

        const summaryLines = pdf.splitTextToSize(
          summary,
          contentWidth - 22,
        ) as string[]

        const visibleSummaryLines = summaryLines.slice(0, 7)

        const areas = project.departments.map(
          (department) => department.name,
        )

        const projectAssuntos = project.tags
          .filter((tag) => tag.category === "assunto")
          .map((tag) => tag.name)

        const projectSetores = project.tags
          .filter((tag) => tag.category === "setor")
          .map((tag) => tag.name)

        const classifications = [
          areas.length > 0
            ? `Áreas: ${areas.join(", ")}`
            : null,

          projectAssuntos.length > 0
            ? `Assuntos: ${projectAssuntos.join(", ")}`
            : null,

          projectSetores.length > 0
            ? `Setores: ${projectSetores.join(", ")}`
            : null,
        ].filter(Boolean) as string[]

        const classificationLines = classifications.flatMap(
          (classification) =>
            pdf.splitTextToSize(
              classification,
              contentWidth - 22,
            ) as string[],
        )

        const valueLines: string[] = []

        if (
          project.portfolio.show_values_in_pdf &&
          project.portfolio.projected_demand !== null
        ) {
          const demand =
            project.portfolio.projected_demand.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })

          valueLines.push(
            `Demanda projetada: ${demand}${
              project.portfolio.projected_demand_unit
                ? ` ${project.portfolio.projected_demand_unit}`
                : ""
            }`,
          )
        }

        if (
          project.portfolio.show_values_in_pdf &&
          project.portfolio.capex !== null
        ) {
          valueLines.push(
            `CAPEX: ${formatCurrency(
              project.portfolio.capex,
              project.portfolio.currency,
            )}`,
          )
        }

        const completionDate = formatDate(
          project.portfolio.completion_date,
        )

        const cardHeight = Math.max(
          45,
          27 +
            visibleSummaryLines.length * 3.8 +
            Math.min(classificationLines.length, 4) * 3.6 +
            valueLines.length * 3.6 +
            (completionDate ? 4 : 0),
        )

        if (y + cardHeight > 276) {
          addProjectsPage()
        }

        pdf.setFillColor(...COLORS.white)
        pdf.setDrawColor(...COLORS.border)
        pdf.setLineWidth(0.25)

        pdf.roundedRect(
          marginX,
          y,
          contentWidth,
          cardHeight,
          2,
          2,
          "FD",
        )

        pdf.setFillColor(...COLORS.blue)

        pdf.roundedRect(
          marginX,
          y,
          9,
          cardHeight,
          2,
          2,
          "F",
        )

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(10)
        pdf.setTextColor(...COLORS.white)

        pdf.text(
          String(index + 1).padStart(2, "0"),
          marginX + 4.5,
          y + 10,
          {
            align: "center",
          },
        )

        const textX = marginX + 15
        const textWidth = contentWidth - 21

        let cardY = y + 8

        if (project.code) {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(6.5)
          pdf.setTextColor(...COLORS.blue)

          pdf.text(
            project.code.toUpperCase(),
            textX,
            cardY,
          )

          cardY += 6
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor(...COLORS.navy)

        const projectNameLines = pdf.splitTextToSize(
          project.name,
          textWidth,
        ) as string[]

        pdf.text(
          projectNameLines.slice(0, 2),
          textX,
          cardY,
          {
            lineHeightFactor: 1.15,
          },
        )

        cardY += Math.min(projectNameLines.length, 2) * 5 + 3

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...COLORS.text)

        pdf.text(
          visibleSummaryLines,
          textX,
          cardY,
          {
            lineHeightFactor: 1.25,
          },
        )

        cardY += visibleSummaryLines.length * 3.8 + 4

        if (classificationLines.length > 0) {
          pdf.setFontSize(6.8)
          pdf.setTextColor(...COLORS.muted)

          pdf.text(
            classificationLines.slice(0, 4),
            textX,
            cardY,
            {
              lineHeightFactor: 1.25,
            },
          )

          cardY +=
            Math.min(classificationLines.length, 4) * 3.6 +
            2
        }

        if (valueLines.length > 0) {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(6.8)
          pdf.setTextColor(...COLORS.navy)

          pdf.text(
            valueLines,
            textX,
            cardY,
            {
              lineHeightFactor: 1.25,
            },
          )

          cardY += valueLines.length * 3.6 + 1
        }

        if (completionDate) {
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(6.5)
          pdf.setTextColor(...COLORS.muted)

          pdf.text(
            `Conclusão: ${completionDate}`,
            textX,
            cardY,
          )
        }

        y += cardHeight + 6
      })

      // =====================================================
      // RODAPÉ / NUMERAÇÃO
      // =====================================================

      const totalPages = pdf.getNumberOfPages()

      for (let page = 1; page <= totalPages; page++) {
        pdf.setPage(page)

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(6)
        pdf.setTextColor(...COLORS.muted)

        pdf.text(
          `${page} / ${totalPages}`,
          pageWidth - marginX,
          pageHeight - 7,
          {
            align: "right",
          },
        )
      }

      const year = new Date().getFullYear()

      pdf.save(
        `${sanitizeFilename(
          `portfolio-ec-projetos-${year}`,
        )}.pdf`,
      )
    } catch (error) {
      console.error(error)

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o portfólio em PDF.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={generatePdf}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}

      {loading
        ? "Gerando portfólio..."
        : "Exportar portfólio PDF"}
    </Button>
  )
}