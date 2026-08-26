import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getPortfolioProjects } from "@/app/actions/portfolio"
import { Clock, FolderKanban } from "lucide-react"

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects()

  return (
    <div className="w-full min-h-full rounded-2xl border bg-white p-6 shadow-lg dark:bg-[#1c1c20]">
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
              <BreadcrumbPage>Portfólio</BreadcrumbPage>
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

        <div className="mb-5 text-sm text-muted-foreground">
          {projects.length}{" "}
          {projects.length === 1 ? "projeto concluído" : "projetos concluídos"}
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const portfolioPreenchido = project.portfolio !== null

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
                        <Badge>Portfólio preenchido</Badge>
                      ) : (
                        <Badge variant="secondary">
                          Dados do portfólio pendentes
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-lg">{project.name}</CardTitle>

                    <CardDescription className="line-clamp-3">
                      {project.description ||
                        "Projeto sem descrição cadastrada."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={
                              tag.category === "setor" ? "secondary" : "outline"
                            }
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {project.estimated_hours !== null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />

                        <span>{project.estimated_hours} horas estimadas</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link href={`/portfolio/${project.id}/editar`}>
                        {portfolioPreenchido
                          ? "Editar dados do Portfólio"
                          : "Completar dados do Portfólio"}
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/projetos/${project.id}`}>
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
    </div>
  )
}
