"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type PortfolioTag = {
  id: number
  name: string
  category: "assunto" | "setor"
  sort_order: number
}

export type PortfolioDepartment = {
  id: number
  name: string
}

export type PortfolioProject = {
  id: number
  code: string | null
  name: string
  description: string | null
  estimated_hours: number | null
  status: "concluido"

  departments: PortfolioDepartment[]
  tags: PortfolioTag[]

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
      "Erro ao buscar projetos concluídos: " + projectsError.message,
    )
  }

  if (!projects || projects.length === 0) {
    return []
  }

  const projectIds = projects.map((project) => project.id)

  const { data: projectDepartmentRows, error: projectDepartmentsError } =
    await supabase
      .from("project_departments")
      .select("project_id, department_id")
      .in("project_id", projectIds)

  if (projectDepartmentsError) {
    throw new Error(
      "Erro ao buscar as áreas dos projetos: " +
        projectDepartmentsError.message,
    )
  }

  const departmentIds = Array.from(
    new Set(
      (projectDepartmentRows ?? []).map((row) => Number(row.department_id)),
    ),
  )

  const departmentById = new Map<number, PortfolioDepartment>()

  if (departmentIds.length > 0) {
    const { data: departmentRows, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", departmentIds)

    if (departmentsError) {
      throw new Error(
        "Erro ao buscar os departamentos: " + departmentsError.message,
      )
    }

    for (const department of departmentRows ?? []) {
      departmentById.set(Number(department.id), {
        id: Number(department.id),
        name: department.name,
      })
    }
  }

  const departmentsByProject = new Map<number, PortfolioDepartment[]>()

  for (const relation of projectDepartmentRows ?? []) {
    const projectId = Number(relation.project_id)
    const department = departmentById.get(Number(relation.department_id))

    if (!department) {
      continue
    }

    const current = departmentsByProject.get(projectId) ?? []

    current.push(department)

    departmentsByProject.set(projectId, current)
  }

  for (const [
    projectId,
    projectDepartments,
  ] of departmentsByProject.entries()) {
    projectDepartments.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

    departmentsByProject.set(projectId, projectDepartments)
  }

  const { data: portfolioRows, error: portfolioError } = await supabase
    .from("project_portfolio")
    .select(
      `
      id,
      project_id,
      executive_summary,
      associated_investment,
      capex,
      currency,
      completion_date
    `,
    )
    .in("project_id", projectIds)

  if (portfolioError) {
    throw new Error(
      "Erro ao buscar dados do portfólio: " + portfolioError.message,
    )
  }
  const portfolioIds = (portfolioRows ?? []).map((portfolio) =>
    Number(portfolio.id),
  )

  const tagsByPortfolio = new Map<number, PortfolioTag[]>()

  if (portfolioIds.length > 0) {
    const { data: relationRows, error: relationsError } = await supabase
      .from("project_portfolio_tags")
      .select("portfolio_id, tag_id")
      .in("portfolio_id", portfolioIds)

    if (relationsError) {
      throw new Error(
        "Erro ao buscar classificações do portfólio: " + relationsError.message,
      )
    }

    const tagIds = Array.from(
      new Set((relationRows ?? []).map((row) => Number(row.tag_id))),
    )

    if (tagIds.length > 0) {
      const { data: tagRows, error: tagsError } = await supabase
        .from("portfolio_tags")
        .select("id, name, category, sort_order")
        .eq("active", true)
        .in("id", tagIds)

      if (tagsError) {
        throw new Error(
          "Erro ao buscar os rótulos do portfólio: " + tagsError.message,
        )
      }

      const tagById = new Map<number, PortfolioTag>(
        (tagRows ?? []).map((tag) => [
          Number(tag.id),
          {
            id: Number(tag.id),
            name: tag.name,
            category: tag.category as "assunto" | "setor",
            sort_order: Number(tag.sort_order),
          },
        ]),
      )

      for (const relation of relationRows ?? []) {
        const portfolioId = Number(relation.portfolio_id)
        const tag = tagById.get(Number(relation.tag_id))

        if (!tag) {
          continue
        }

        const current = tagsByPortfolio.get(portfolioId) ?? []

        current.push(tag)
        tagsByPortfolio.set(portfolioId, current)
      }

      for (const [portfolioId, tags] of tagsByPortfolio.entries()) {
        tags.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }

          return a.sort_order - b.sort_order
        })

        tagsByPortfolio.set(portfolioId, tags)
      }
    }
  }

  const portfolioByProject = new Map(
    (portfolioRows ?? []).map((portfolio) => [
      Number(portfolio.project_id),
      portfolio,
    ]),
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

      departments: departmentsByProject.get(Number(project.id)) ?? [],

      tags: portfolio ? (tagsByPortfolio.get(Number(portfolio.id)) ?? []) : [],

      portfolio: portfolio
        ? {
            id: Number(portfolio.id),
            executive_summary: portfolio.executive_summary,
            associated_investment:
              portfolio.associated_investment === null
                ? null
                : Number(portfolio.associated_investment),
            capex: portfolio.capex === null ? null : Number(portfolio.capex),
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
  tag_ids: number[]
  departments: PortfolioDepartment[]
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
  tag_ids: number[]
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
    throw new Error("Erro ao buscar o projeto: " + projectError.message)
  }

  if (!project) {
    return null
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("project_portfolio")
    .select(
      `
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
    `,
    )
    .eq("project_id", projectId)
    .maybeSingle()

  if (portfolioError) {
    throw new Error(
      "Erro ao buscar os dados do portfólio: " + portfolioError.message,
    )
  }
  let tagIds: number[] = []

  if (portfolio) {
    const { data: tagRows, error: tagsError } = await supabase
      .from("project_portfolio_tags")
      .select("tag_id")
      .eq("portfolio_id", portfolio.id)

    if (tagsError) {
      throw new Error(
        "Erro ao buscar os rótulos do projeto: " + tagsError.message,
      )
    }

    tagIds = (tagRows ?? []).map((row) => Number(row.tag_id))
  }

  // Áreas do projeto
  const { data: projectDepartmentRows, error: projectDepartmentsError } =
    await supabase
      .from("project_departments")
      .select("department_id")
      .eq("project_id", projectId)

  if (projectDepartmentsError) {
    throw new Error(
      "Erro ao buscar as áreas do projeto: " + projectDepartmentsError.message,
    )
  }

  const departmentIds = (projectDepartmentRows ?? []).map((row) =>
    Number(row.department_id),
  )

  let departments: PortfolioDepartment[] = []

  if (departmentIds.length > 0) {
    const { data: departmentRows, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", departmentIds)

    if (departmentsError) {
      throw new Error(
        "Erro ao buscar os departamentos: " + departmentsError.message,
      )
    }

    departments = (departmentRows ?? [])
      .map((department) => ({
        id: Number(department.id),
        name: department.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }

  return {
    id: Number(project.id),
    code: project.code,
    name: project.name,
    description: project.description,
    estimated_hours:
      project.estimated_hours === null ? null : Number(project.estimated_hours),

    departments,

    tag_ids: tagIds,

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
          capex: portfolio.capex === null ? null : Number(portfolio.capex),
          currency: portfolio.currency ?? "BRL",
          completion_date: portfolio.completion_date,
          notes: portfolio.notes,
          allow_external_export: portfolio.allow_external_export ?? false,
          show_values_in_pdf: portfolio.show_values_in_pdf ?? false,
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
    throw new Error("Erro ao validar o projeto: " + projectError.message)
  }

  if (!project) {
    throw new Error(
      "Somente projetos concluídos podem ser cadastrados no portfólio.",
    )
  }

  if (input.associated_investment !== null && input.associated_investment < 0) {
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
      input.completion_date === "" ? null : input.completion_date,
    notes: emptyToNull(input.notes),
    allow_external_export: input.allow_external_export,
    show_values_in_pdf: input.show_values_in_pdf,
    updated_at: new Date().toISOString(),
  }

  const { data: savedPortfolio, error } = await supabase
    .from("project_portfolio")
    .upsert(payload, {
      onConflict: "project_id",
    })
    .select("id")
    .single()

  if (error) {
    throw new Error("Erro ao salvar os dados do portfólio: " + error.message)
  }

  if (!savedPortfolio) {
    throw new Error(
      "Não foi possível identificar o registro do portfólio salvo.",
    )
  }

  const portfolioId = Number(savedPortfolio.id)

  const tagIds = Array.from(
    new Set(input.tag_ids.filter((id) => Number.isInteger(id) && id > 0)),
  )

  if (tagIds.length > 0) {
    const { data: validTags, error: validTagsError } = await supabase
      .from("portfolio_tags")
      .select("id")
      .eq("active", true)
      .in("id", tagIds)

    if (validTagsError) {
      throw new Error(
        "Erro ao validar os rótulos selecionados: " + validTagsError.message,
      )
    }

    if ((validTags ?? []).length !== tagIds.length) {
      throw new Error("Um ou mais rótulos selecionados não são válidos.")
    }
  }

  const { data: currentTagRows, error: currentTagsError } = await supabase
    .from("project_portfolio_tags")
    .select("tag_id")
    .eq("portfolio_id", portfolioId)

  if (currentTagsError) {
    throw new Error(
      "Erro ao consultar os rótulos atuais: " + currentTagsError.message,
    )
  }

  const currentTagIds = (currentTagRows ?? []).map((row) => Number(row.tag_id))

  const tagsToAdd = tagIds.filter((tagId) => !currentTagIds.includes(tagId))

  const tagsToRemove = currentTagIds.filter((tagId) => !tagIds.includes(tagId))

  if (tagsToAdd.length > 0) {
    const { error: insertTagsError } = await supabase
      .from("project_portfolio_tags")
      .insert(
        tagsToAdd.map((tagId) => ({
          portfolio_id: portfolioId,
          tag_id: tagId,
        })),
      )

    if (insertTagsError) {
      throw new Error(
        "Erro ao adicionar os rótulos: " + insertTagsError.message,
      )
    }
  }

  if (tagsToRemove.length > 0) {
    const { error: removeTagsError } = await supabase
      .from("project_portfolio_tags")
      .delete()
      .eq("portfolio_id", portfolioId)
      .in("tag_id", tagsToRemove)

    if (removeTagsError) {
      throw new Error("Erro ao remover os rótulos: " + removeTagsError.message)
    }
  }

  revalidatePath("/portfolio")
  revalidatePath(`/portfolio/${projectId}/editar`)

  return { success: true }
}

export async function getPortfolioTags(): Promise<PortfolioTag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio_tags")
    .select("id, name, category, sort_order")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw new Error("Erro ao buscar os rótulos do portfólio: " + error.message)
  }

  return (data ?? []).map((tag) => ({
    id: Number(tag.id),
    name: tag.name,
    category: tag.category as "assunto" | "setor",
    sort_order: Number(tag.sort_order),
  }))
}
export type PortfolioCase = {
  id: number
  code: string | null
  name: string
  description: string | null
  estimated_hours: number | null

  departments: PortfolioDepartment[]
  tags: PortfolioTag[]

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
  }
}

export async function getPortfolioCaseById(
  projectId: number,
): Promise<PortfolioCase | null> {
  const supabase = await createClient()

  // Projeto concluído
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, code, name, description, estimated_hours, status")
    .eq("id", projectId)
    .eq("status", "concluido")
    .maybeSingle()

  if (projectError) {
    throw new Error("Erro ao buscar o projeto: " + projectError.message)
  }

  if (!project) {
    return null
  }

  // Ficha de portfólio
  const { data: portfolio, error: portfolioError } = await supabase
    .from("project_portfolio")
    .select(
      `
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
      `,
    )
    .eq("project_id", projectId)
    .maybeSingle()

  if (portfolioError) {
    throw new Error(
      "Erro ao buscar os dados do portfólio: " + portfolioError.message,
    )
  }

  // Um projeto pendente ainda não possui um case para visualizar.
  if (!portfolio) {
    return null
  }

  // Áreas
  const { data: projectDepartmentRows, error: projectDepartmentsError } =
    await supabase
      .from("project_departments")
      .select("department_id")
      .eq("project_id", projectId)

  if (projectDepartmentsError) {
    throw new Error(
      "Erro ao buscar as áreas do projeto: " + projectDepartmentsError.message,
    )
  }

  const departmentIds = (projectDepartmentRows ?? []).map((row) =>
    Number(row.department_id),
  )

  let departments: PortfolioDepartment[] = []

  if (departmentIds.length > 0) {
    const { data: departmentRows, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", departmentIds)

    if (departmentsError) {
      throw new Error(
        "Erro ao buscar os departamentos: " + departmentsError.message,
      )
    }

    departments = (departmentRows ?? [])
      .map((department) => ({
        id: Number(department.id),
        name: department.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }

  // Relações de tags
  const { data: relationRows, error: relationsError } = await supabase
    .from("project_portfolio_tags")
    .select("tag_id")
    .eq("portfolio_id", portfolio.id)

  if (relationsError) {
    throw new Error(
      "Erro ao buscar as classificações do projeto: " + relationsError.message,
    )
  }

  const tagIds = (relationRows ?? []).map((row) => Number(row.tag_id))

  let tags: PortfolioTag[] = []

  if (tagIds.length > 0) {
    const { data: tagRows, error: tagsError } = await supabase
      .from("portfolio_tags")
      .select("id, name, category, sort_order")
      .eq("active", true)
      .in("id", tagIds)

    if (tagsError) {
      throw new Error(
        "Erro ao buscar os rótulos do projeto: " + tagsError.message,
      )
    }

    tags = (tagRows ?? [])
      .map((tag) => ({
        id: Number(tag.id),
        name: tag.name,
        category: tag.category as "assunto" | "setor",
        sort_order: Number(tag.sort_order),
      }))
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }

        return a.sort_order - b.sort_order
      })
  }

  return {
    id: Number(project.id),
    code: project.code,
    name: project.name,
    description: project.description,

    estimated_hours:
      project.estimated_hours === null ? null : Number(project.estimated_hours),

    departments,
    tags,

    portfolio: {
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

      capex: portfolio.capex === null ? null : Number(portfolio.capex),

      currency: portfolio.currency ?? "BRL",
      completion_date: portfolio.completion_date,
      notes: portfolio.notes,

      allow_external_export: portfolio.allow_external_export ?? false,

      show_values_in_pdf: portfolio.show_values_in_pdf ?? false,
    },
  }
}
