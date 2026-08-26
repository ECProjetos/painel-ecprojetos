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

export function PortfolioGrid({
  projects,
  tags,
}: PortfolioGridProps) {
  const [search, setSearch] = useState("")
  const [assuntoId, setAssuntoId] = useState("")
  const [setorId, setSetorId] = useState("")

  const assuntoTags = tags.filter(
    (tag) => tag.category === "assunto",
  )

  const setorTags = tags.filter(
    (tag) => tag.category === "setor",
  )

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
        ]
          .filter(Boolean)
          .join(" "),
      )

      const matchesSearch =
        normalizedSearch === "" ||
        searchableContent.includes(normalizedSearch)

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
        matchesAssunto &&
        matchesSetor
      )
    })
  }, [projects, search, assuntoId, setorId])

  const hasFilters =
    search !== "" ||
    assuntoId !== "" ||
    setorId !== ""

  function clearFilters() {
    setSearch("")
    setAssuntoId("")
    setSetorId("")
  }

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
          <div className="relative">
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

          <select
            value={assuntoId}
            onChange={(event) =>
              setAssuntoId(event.target.value)
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todos os assuntos</option>

            {assuntoTags.map((tag) => (
              <option
                key={tag.id}
                value={String(tag.id)}
              >
                {tag.name}
              </option>
            ))}
          </select>

          <select
            value={setorId}
            onChange={(event) =>
              setSetorId(event.target.value)
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todos os setores</option>

            {setorTags.map((tag) => (
              <option
                key={tag.id}
                value={String(tag.id)}
              >
                {tag.name}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            disabled={!hasFilters}
            onClick={clearFilters}
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

      {/* SEM RESULTADO */}
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
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const portfolioPreenchido =
              project.portfolio !== null

            return (
              <Card
                key={project.id}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
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

                <CardContent className="flex-1 space-y-4">
                  {project.tags.length > 0 && (
                    <div className="space-y-3">
                      {project.tags.some(
                        (tag) =>
                          tag.category === "assunto",
                      ) && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                            Assuntos
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {project.tags
                              .filter(
                                (tag) =>
                                  tag.category ===
                                  "assunto",
                              )
                              .map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}

                      {project.tags.some(
                        (tag) =>
                          tag.category === "setor",
                      ) && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                            Setores
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {project.tags
                              .filter(
                                (tag) =>
                                  tag.category ===
                                  "setor",
                              )
                              .map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {project.estimated_hours !== null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />

                      <span>
                        {project.estimated_hours} horas estimadas
                      </span>
                    </div>
                  )}
                </CardContent>

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