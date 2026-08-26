"use client"

import { FileDown } from "lucide-react"
import { jsPDF } from "jspdf"

import type { PortfolioCase } from "@/app/actions/portfolio"
import { Button } from "@/components/ui/button"

type PortfolioPdfButtonProps = {
  project: PortfolioCase
}

function formatDepartmentName(name: string) {
  return name
    .replace(/^Departamento de /i, "")
    .replace(/^Departamento da /i, "")
    .replace(/^Departamento do /i, "")
    .replace(/^Departamento /i, "")
}

function formatCurrency(
  value: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString("pt-BR")}`
  }
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
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

export function PortfolioPdfButton({
  project,
}: PortfolioPdfButtonProps) {
  function generatePdf() {
    if (
      !project.portfolio.allow_external_export
    ) {
      const proceed = window.confirm(
        "Este projeto não está marcado como autorizado para exportação externa. Deseja gerar o PDF mesmo assim para uso interno?",
      )

      if (!proceed) {
        return
      }
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    const marginX = 18
    const maxWidth = pageWidth - marginX * 2

    let y = 20

    const assuntos = project.tags
      .filter((tag) => tag.category === "assunto")
      .map((tag) => tag.name)

    const setores = project.tags
      .filter((tag) => tag.category === "setor")
      .map((tag) => tag.name)

    const areas = project.departments.map(
      (department) =>
        formatDepartmentName(department.name),
    )

    function addPageIfNeeded(
      requiredHeight = 20,
    ) {
      if (
        y + requiredHeight >
        pageHeight - 18
      ) {
        doc.addPage()
        y = 20

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(110)

        doc.text(
          "EC Projetos — Portfólio de Projetos",
          marginX,
          10,
        )

        doc.setTextColor(0)
      }
    }

    function addSectionTitle(title: string) {
      addPageIfNeeded(18)

      y += 5

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(25)

      doc.text(title.toUpperCase(), marginX, y)

      y += 3

      doc.setDrawColor(220)
      doc.line(
        marginX,
        y,
        pageWidth - marginX,
        y,
      )

      y += 7
    }

    function addParagraph(
      text: string | null,
    ) {
      if (!text) {
        return
      }

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(70)

      const lines = doc.splitTextToSize(
        text,
        maxWidth,
      )

      for (const line of lines) {
        addPageIfNeeded(7)

        doc.text(line, marginX, y)
        y += 5.5
      }

      y += 2
    }

    function addInfo(
      label: string,
      value: string,
    ) {
      addPageIfNeeded(10)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(90)

      doc.text(label, marginX, y)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(20)

      const valueLines = doc.splitTextToSize(
        value,
        maxWidth - 50,
      )

      doc.text(
        valueLines,
        marginX + 50,
        y,
      )

      y +=
        Math.max(
          6,
          valueLines.length * 5,
        )
    }

    // =====================================================
    // CABEÇALHO
    // =====================================================

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30)

    doc.text(
      "EC PROJETOS",
      marginX,
      y,
    )

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(110)

    doc.text(
      "PORTFÓLIO DE PROJETOS",
      marginX,
      y + 5,
    )

    y += 18

    doc.setDrawColor(215)

    doc.line(
      marginX,
      y,
      pageWidth - marginX,
      y,
    )

    y += 12

    if (project.code) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(80)

      doc.text(
        project.code,
        marginX,
        y,
      )

      y += 7
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(10)

    const titleLines = doc.splitTextToSize(
      project.name,
      maxWidth,
    )

    doc.text(
      titleLines,
      marginX,
      y,
    )

    y += titleLines.length * 8 + 4

    if (project.description) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(90)

      const descriptionLines =
        doc.splitTextToSize(
          project.description,
          maxWidth,
        )

      doc.text(
        descriptionLines,
        marginX,
        y,
      )

      y +=
        descriptionLines.length * 5.5 +
        7
    }

    // =====================================================
    // CLASSIFICAÇÕES
    // =====================================================

    if (areas.length > 0) {
      addInfo(
        "Áreas",
        areas.join(" • "),
      )
    }

    if (assuntos.length > 0) {
      addInfo(
        "Assuntos",
        assuntos.join(" • "),
      )
    }

    if (setores.length > 0) {
      addInfo(
        "Setores",
        setores.join(" • "),
      )
    }

    // =====================================================
    // DADOS PRINCIPAIS
    // =====================================================

    if (
      project.portfolio.completion_date
    ) {
      addInfo(
        "Conclusão",
        formatDate(
          project.portfolio
            .completion_date,
        ),
      )
    }

    if (
      project.estimated_hours !== null
    ) {
      addInfo(
        "Horas estimadas",
        `${project.estimated_hours.toLocaleString(
          "pt-BR",
        )} h`,
      )
    }

    if (
      project.portfolio
        .show_values_in_pdf
    ) {
      if (
        project.portfolio
          .associated_investment !== null
      ) {
        addInfo(
          "Investimento associado",
          formatCurrency(
            project.portfolio
              .associated_investment,
            project.portfolio.currency,
          ),
        )
      }

      if (
        project.portfolio.capex !== null
      ) {
        addInfo(
          "CAPEX",
          formatCurrency(
            project.portfolio.capex,
            project.portfolio.currency,
          ),
        )
      }
    }

    // =====================================================
    // CONTEÚDO
    // =====================================================

    if (
      project.portfolio
        .executive_summary
    ) {
      addSectionTitle(
        "Resumo executivo",
      )

      addParagraph(
        project.portfolio
          .executive_summary,
      )
    }

    if (project.portfolio.challenge) {
      addSectionTitle(
        "Desafio / contexto",
      )

      addParagraph(
        project.portfolio.challenge,
      )
    }

    if (project.portfolio.solution) {
      addSectionTitle(
        "Solução desenvolvida",
      )

      addParagraph(
        project.portfolio.solution,
      )
    }

    if (project.portfolio.results) {
      addSectionTitle(
        "Resultados alcançados",
      )

      addParagraph(
        project.portfolio.results,
      )
    }

    if (
      project.portfolio
        .quantitative_results
    ) {
      addSectionTitle(
        "Resultados quantitativos",
      )

      addParagraph(
        project.portfolio
          .quantitative_results,
      )
    }

    // =====================================================
    // RODAPÉ
    // =====================================================

    const totalPages =
      doc.getNumberOfPages()

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      doc.setPage(page)

      doc.setDrawColor(225)

      doc.line(
        marginX,
        pageHeight - 13,
        pageWidth - marginX,
        pageHeight - 13,
      )

      doc.setFont(
        "helvetica",
        "normal",
      )

      doc.setFontSize(7)
      doc.setTextColor(130)

      doc.text(
        "EC Projetos — Portfólio de Projetos",
        marginX,
        pageHeight - 8,
      )

      doc.text(
        `${page} / ${totalPages}`,
        pageWidth - marginX,
        pageHeight - 8,
        {
          align: "right",
        },
      )
    }

    const filename = [
      "portfolio",
      project.code,
      project.name,
    ]
      .filter(Boolean)
      .join("-")

    doc.save(
      `${sanitizeFilename(filename)}.pdf`,
    )
  }

  return (
    <Button
      type="button"
      onClick={generatePdf}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  )
}