"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Clock, Search } from "lucide-react"

import type {
  PortfolioProject,
  PortfolioTag,
} from "@/app/actions/portfolio"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type PortfolioGridProps = {
  projects: PortfolioProject[]
  tags: PortfolioTag[]
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function formatDepartmentName(name: string) {
  return name
    .replace(/^Departamento de /i, "")
    .replace(/^Departamento da /i, "")
    .replace(/^Departamento do /i, "")
    .replace(/^Departamento /i, "")
}

export function PortfolioGrid({
  projects,
  tags,
}: PortfolioGridProps) {
  const [search, setSearch] = useState("")
  const [areaId, setAreaId] = useState("")
  const [assuntoId, setAssuntoId] = useState("")
  const [setorId, setSetorId] = useState("")

  const assuntoTags = tags.filter(
    (tag) => tag.category === "assunto",
  )

  const setorTags = tags.filter(
    (tag) => tag.category === "setor",
  )

  const areas = useMemo(() => {
    const areaMap = new Map<
      number,
      {
        id: number
        name: string
      }
    >()

    for (const project of projects) {
      for (const department of project.departments) {
        areaMap.set(department.id, department)
      }
    }

    return Array.from(areaMap.values()).sort((a, b) =>
      formatDepartmentName(a.name).localeCompare(
        formatDepartmentName(b.name),
        "pt-BR",
      ),
    )
  }, [projects])

  const filteredProjects = useMemo(() => {
    const normalizedSearch = normalizeText(search)

    return projects.filter((project) => {
      const searchableContent = normalizeText(
        [
          project.code,
          project.name,
          project.description,
          project.portfolio?.executive_summary,

          ...project.tags.map((tag) => tag.name),

          ...project.departments.map(
            (department) => department.name,
          ),
        ]
          .filter(Boolean)
          .join(" "),
      )

      const matchesSearch =
        normalizedSearch === "" ||
        searchableContent.includes(normalizedSearch)

      const matchesArea =
        areaId === "" ||
        project.departments.some(
          (department) =>
            String(department.id) === areaId,
        )

      const matchesAssunto =
        assuntoId === "" ||
        project.tags.some(
          (tag) =>
            tag.category === "assunto" &&
            String(tag.id) === assuntoId,
        )

      const matchesSetor =
        setorId === "" ||
        project.tags.some(
          (tag) =>
            tag.category === "setor" &&
            String(tag.id) === setorId,
        )

      return (
        matchesSearch &&
        matchesArea &&
        matchesAssunto &&
        matchesSetor
      )
    })
  }, [
    projects,
    search,
    areaId,
    assuntoId,
    setorId,
  ])

  const hasFilters =
    search !== "" ||
    areaId !== "" ||
    assuntoId !== "" ||
    setorId !== ""

  function clearFilters() {
    setSearch("")
    setAreaId("")
    setAssuntoId("")
    setSetorId("")
  }

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(320px,1.8fr)_repeat(3,minmax(170px,1fr))_auto]">
          {/* BUSCA */}
          <div className="relative md:col-span-2 2xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por projeto, código, descrição ou assunto..."
              className="pl-9"
            />
          </div>

          {/* ÁREA */}
          <select
            value={areaId}
            onChange={(event) =>
              setAreaId(event.target.value)
            }
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">
              Todas as áreas
            </option>

            {areas.map((area) => (
              <option
                key={area.id}
                value={String(area.id)}
              >
                {formatDepartmentName(area.name)}
              </option>
            ))}
          </select>

          {/* ASSUNTO */}
          <select
            value={assuntoId}
            onChange={(event) =>
              setAssuntoId(event.target.value)
            }
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">
              Todos os assuntos
            </option>

            {assuntoTags.map((tag) => (
              <option
                key={tag.id}
                value={String(tag.id)}
              >
                {tag.name}
              </option>
            ))}
          </select>

          {/* SETOR */}
          <select
            value={setorId}
            onChange={(event) =>
              setSetorId(event.target.value)
            }
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">
              Todos os setores
            </option>

            {setorTags.map((tag) => (
              <option
                key={tag.id}
                value={String(tag.id)}
              >
                {tag.name}
              </option>
            ))}
          </select>

          {/* LIMPAR */}
          <Button
            type="button"
            variant="outline"
            disabled={!hasFilters}
            onClick={clearFilters}
            className="md:col-span-2 2xl:col-span-1 2xl:w-auto"
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* CONTADOR */}
      <div className="text-sm text-muted-foreground">
        {filteredProjects.length}{" "}
        {filteredProjects.length === 1
          ? "projeto encontrado"
          : "projetos encontrados"}
      </div>

      {/* SEM RESULTADOS */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Nenhum projeto encontrado
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tente alterar os filtros ou os termos da busca.
              </p>

              {hasFilters && (
                <Button
                  type="button"
                  variant="link"
                  className="mt-2"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* CARDS */
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const portfolioPreenchido =
              project.portfolio !== null

            const assuntos = project.tags.filter(
              (tag) => tag.category === "assunto",
            )

            const setores = project.tags.filter(
              (tag) => tag.category === "setor",
            )

            return (
              <Card
                key={project.id}
                className="flex h-full min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* CABEÇALHO */}
                <CardHeader>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">
                      {project.code ?? "Sem código"}
                    </Badge>

                    {portfolioPreenchido ? (
                      <Badge>
                        Portfólio preenchido
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Dados do portfólio pendentes
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg">
                    {project.name}
                  </CardTitle>

                  <CardDescription className="line-clamp-3">
                    {project.description ||
                      "Projeto sem descrição cadastrada."}
                  </CardDescription>
                </CardHeader>

                {/* CONTEÚDO */}
                <CardContent className="flex-1 space-y-5">
                  {/* ÁREAS */}
                  {project.departments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Áreas
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {project.departments.map(
                          (department) => (
                            <Badge
                              key={department.id}
                              variant="default"
                              className="max-w-full whitespace-normal text-left"
                            >
                              {formatDepartmentName(
                                department.name,
                              )}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* ASSUNTOS */}
                  {assuntos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Assuntos
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {assuntos.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="whitespace-normal"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SETORES */}
                  {setores.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Setores
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {setores.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="whitespace-normal"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HORAS */}
                  {project.estimated_hours !== null && (
                    <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />

                      <span>
                        {project.estimated_hours} horas estimadas
                      </span>
                    </div>
                  )}
                </CardContent>

                {/* AÇÕES */}
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link
                      href={`/portfolio/${project.id}/editar`}
                    >
                      {portfolioPreenchido
                        ? "Editar dados do Portfólio"
                        : "Completar dados do Portfólio"}
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link
                      href={`/projetos/${project.id}`}
                    >
                      Abrir projeto
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}