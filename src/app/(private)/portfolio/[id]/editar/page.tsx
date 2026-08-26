import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { getPortfolioProjectById, getPortfolioTags } from "@/app/actions/portfolio"
import { PortfolioForm } from "@/components/portfolio/portfolio-form"

type PortfolioEditPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PortfolioEditPage({
  params,
}: PortfolioEditPageProps) {
  const { id } = await params
  const projectId = Number(id)

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0
  ) {
    notFound()
  }

  const [project, tags] = await Promise.all([
    getPortfolioProjectById(projectId), 
    getPortfolioTags(),
])

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-full w-full rounded-2xl border bg-white p-6 shadow-lg dark:bg-[#1c1c20]">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/inicio">
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbLink href="/portfolio">
                Portfólio
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>
                {project.code ?? project.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-8">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.code && (
              <Badge variant="outline">
                {project.code}
              </Badge>
            )}

            <Badge
              variant={
                project.portfolio
                  ? "default"
                  : "secondary"
              }
            >
              {project.portfolio
                ? "Portfólio preenchido"
                : "Dados pendentes"}
            </Badge>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.portfolio
                ? "Editar dados do Portfólio"
                : "Completar dados do Portfólio"}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {project.name}
            </p>
          </div>

          <Link
            href="/portfolio"
            className="w-fit text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Voltar ao Portfólio
          </Link>
        </div>

        <PortfolioForm project={project} tags={tags} />
      </div>
    </div>
  )
}