import { redirect } from "next/navigation"

import {
  getFeriasEquipeDashboard,
  isLiderFeriasEquipe,
} from "@/app/actions/ferias"
import FeriasEquipe from "@/components/ferias/ferias-equipe"
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

type PageProps = {
  searchParams?: Promise<{
    ano?: string
    mes?: string
  }>
}

export default async function FeriasEquipePage({ searchParams }: PageProps) {
  const permitido = await isLiderFeriasEquipe()

  if (!permitido) {
    redirect("/controle-horarios/inicio")
  }

  const params = searchParams ? await searchParams : {}
  const agora = new Date()
  const anoAtual = agora.getFullYear()
  const mesAtual = agora.getMonth() + 1

  const anoInformado = Number(params.ano)
  const mesInformado = Number(params.mes)

  const ano =
    Number.isInteger(anoInformado) && anoInformado >= 2020
      ? anoInformado
      : anoAtual

  const mes =
    Number.isInteger(mesInformado) &&
    mesInformado >= 1 &&
    mesInformado <= 12
      ? mesInformado
      : mesAtual

  const dashboard = await getFeriasEquipeDashboard({ ano, mes })

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
            <BreadcrumbPage>Férias da Equipe</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <FeriasEquipe
        lider={dashboard.lider}
        equipes={dashboard.equipes}
        colaboradores={dashboard.colaboradores}
        solicitacoes={dashboard.solicitacoes}
        resumo={dashboard.resumo}
        filtros={{ ano, mes }}
      />
    </div>
  )
}
