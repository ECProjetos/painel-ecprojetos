import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { SidebarTrigger } from "@/components/ui/sidebar"

import {
  getPortfolioProjects,
  getPortfolioTags,
} from "@/app/actions/portfolio"

import { PortfolioGrid } from "@/components/portfolio/portfolio-grid"

import { FolderKanban } from "lucide-react"

export default async function PortfolioPage() {
  const [projects, tags] = await Promise.all([
    getPortfolioProjects(),
    getPortfolioTags(),
  ])

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
              <BreadcrumbPage>
                Portfólio
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="px-4">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Portfólio de Projetos
              </h1>

              <p className="text-sm text-muted-foreground">
                Projetos concluídos e resultados desenvolvidos pela EC Projetos.
              </p>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center">
              <div className="text-center">
                <FolderKanban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                <p className="font-medium">
                  Nenhum projeto concluído encontrado
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Os projetos aparecerão aqui quando tiverem o status
                  &quot;Concluído&quot;.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <PortfolioGrid
            projects={projects}
            tags={tags}
          />
        )}
      </div>
    </div>
  )
}