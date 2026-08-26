"use server"

import { createClient } from "@/utils/supabase/server"

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