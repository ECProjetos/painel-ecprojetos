import { getMinhasFeriasDashboard } from "@/app/actions/ferias"
import MinhasFerias from "@/components/ferias/minhas-ferias"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"

export const dynamic = "force-dynamic"

export default async function MinhasFeriasPage() {
  const dashboard = await getMinhasFeriasDashboard()

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/inicio">
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Solicitação de Férias</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <MinhasFerias
        colaborador={dashboard.colaborador}
        solicitacoes={dashboard.solicitacoes}
        resumo={dashboard.resumo}
      />
    </div>
  )
}
