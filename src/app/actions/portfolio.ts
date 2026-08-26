"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type PortfolioProject = {
  id: number
  code: string | null
  name: string
  description: string | null
  estimated_hours: number | null
  status: "concluido"
  portfolio: {
    id: number
    executive_summary: string | null
    associated_investment: number | null
    capex: number | null
    currency: string
    completion_date: string | null
  } | null
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  const supabase = await createClient()

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, code, name, description, estimated_hours, status")
    .eq("status", "concluido")
    .order("name", { ascending: true })

  if (projectsError) {
    throw new Error(
      "Erro ao buscar projetos concluídos: " + projectsError.message
    )
  }

  if (!projects || projects.length === 0) {
    return []
  }

  const projectIds = projects.map((project) => project.id)

  const { data: portfolioRows, error: portfolioError } = await supabase
    .from("project_portfolio")
    .select(`
      id,
      project_id,
      executive_summary,
      associated_investment,
      capex,
      currency,
      completion_date
    `)
    .in("project_id", projectIds)

  if (portfolioError) {
    throw new Error(
      "Erro ao buscar dados do portfólio: " + portfolioError.message
    )
  }

  const portfolioByProject = new Map(
    (portfolioRows ?? []).map((portfolio) => [
      Number(portfolio.project_id),
      portfolio,
    ])
  )

  return projects.map((project) => {
    const portfolio = portfolioByProject.get(Number(project.id))

    return {
      id: Number(project.id),
      code: project.code,
      name: project.name,
      description: project.description,
      estimated_hours:
        project.estimated_hours === null
          ? null
          : Number(project.estimated_hours),
      status: "concluido" as const,

      portfolio: portfolio
        ? {
            id: Number(portfolio.id),
            executive_summary: portfolio.executive_summary,
            associated_investment:
              portfolio.associated_investment === null
                ? null
                : Number(portfolio.associated_investment),
            capex:
              portfolio.capex === null
                ? null
                : Number(portfolio.capex),
            currency: portfolio.currency,
            completion_date: portfolio.completion_date,
          }
        : null,
    }
  })
}

export type PortfolioProjectDetails = {
  id: number
  code: string | null
  name: string
  description: string | null
  estimated_hours: number | null
  portfolio: {
    id: number
    executive_summary: string | null
    challenge: string | null
    solution: string | null
    results: string | null
    quantitative_results: string | null
    associated_investment: number | null
    capex: number | null
    currency: string
    completion_date: string | null
    notes: string | null
    allow_external_export: boolean
    show_values_in_pdf: boolean
  } | null
}

export type PortfolioFormInput = {
  executive_summary: string
  challenge: string
  solution: string
  results: string
  quantitative_results: string
  associated_investment: number | null
  capex: number | null
  currency: string
  completion_date: string
  notes: string
  allow_external_export: boolean
  show_values_in_pdf: boolean
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export async function getPortfolioProjectById(
  projectId: number,
): Promise<PortfolioProjectDetails | null> {
  const supabase = await createClient()

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, code, name, description, estimated_hours, status")
    .eq("id", projectId)
    .eq("status", "concluido")
    .maybeSingle()

  if (projectError) {
    throw new Error(
      "Erro ao buscar o projeto: " + projectError.message,
    )
  }

  if (!project) {
    return null
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("project_portfolio")
    .select(`
      id,
      executive_summary,
      challenge,
      solution,
      results,
      quantitative_results,
      associated_investment,
      capex,
      currency,
      completion_date,
      notes,
      allow_external_export,
      show_values_in_pdf
    `)
    .eq("project_id", projectId)
    .maybeSingle()

  if (portfolioError) {
    throw new Error(
      "Erro ao buscar os dados do portfólio: " + portfolioError.message,
    )
  }

  return {
    id: Number(project.id),
    code: project.code,
    name: project.name,
    description: project.description,
    estimated_hours:
      project.estimated_hours === null
        ? null
        : Number(project.estimated_hours),

    portfolio: portfolio
      ? {
          id: Number(portfolio.id),
          executive_summary: portfolio.executive_summary,
          challenge: portfolio.challenge,
          solution: portfolio.solution,
          results: portfolio.results,
          quantitative_results: portfolio.quantitative_results,
          associated_investment:
            portfolio.associated_investment === null
              ? null
              : Number(portfolio.associated_investment),
          capex:
            portfolio.capex === null
              ? null
              : Number(portfolio.capex),
          currency: portfolio.currency ?? "BRL",
          completion_date: portfolio.completion_date,
          notes: portfolio.notes,
          allow_external_export:
            portfolio.allow_external_export ?? false,
          show_values_in_pdf:
            portfolio.show_values_in_pdf ?? false,
        }
      : null,
  }
}

export async function savePortfolioProject(
  projectId: number,
  input: PortfolioFormInput,
) {
  const supabase = await createClient()

  // Garante que somente projetos concluídos possam ter ficha de portfólio.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .eq("status", "concluido")
    .maybeSingle()

  if (projectError) {
    throw new Error(
      "Erro ao validar o projeto: " + projectError.message,
    )
  }

  if (!project) {
    throw new Error(
      "Somente projetos concluídos podem ser cadastrados no portfólio.",
    )
  }

  if (
    input.associated_investment !== null &&
    input.associated_investment < 0
  ) {
    throw new Error("O investimento associado não pode ser negativo.")
  }

  if (input.capex !== null && input.capex < 0) {
    throw new Error("O CAPEX não pode ser negativo.")
  }

  const currency = input.currency.trim().toUpperCase()

  if (currency.length !== 3) {
    throw new Error("A moeda deve possuir três caracteres.")
  }

  const payload = {
    project_id: projectId,
    executive_summary: emptyToNull(input.executive_summary),
    challenge: emptyToNull(input.challenge),
    solution: emptyToNull(input.solution),
    results: emptyToNull(input.results),
    quantitative_results: emptyToNull(input.quantitative_results),
    associated_investment: input.associated_investment,
    capex: input.capex,
    currency,
    completion_date:
      input.completion_date === ""
        ? null
        : input.completion_date,
    notes: emptyToNull(input.notes),
    allow_external_export: input.allow_external_export,
    show_values_in_pdf: input.show_values_in_pdf,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("project_portfolio")
    .upsert(payload, {
      onConflict: "project_id",
    })

  if (error) {
    throw new Error(
      "Erro ao salvar os dados do portfólio: " + error.message,
    )
  }

  revalidatePath("/portfolio")
  revalidatePath(`/portfolio/${projectId}/editar`)

  return { success: true }
}