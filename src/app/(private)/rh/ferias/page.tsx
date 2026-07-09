import { redirect } from "next/navigation"
import { getFeriasDashboard, isRhFeriasAdmin } from "@/app/actions/ferias"
import GestaoFerias from "@/components/ferias/gestao-ferias"
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
    status?: string
    colaborador?: string
    equipe?: string
  }>
}

const statusValidos = ["todos", "pendente", "aprovada", "reprovada", "cancelada"]

export default async function FeriasPage({ searchParams }: PageProps) {
  const permitido = await isRhFeriasAdmin()

  if (!permitido) {
    redirect("/controle-horarios/inicio")
  }

  const params = searchParams ? await searchParams : {}

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1

  const ano = params.ano ? Number(params.ano) : anoAtual
  const mes = params.mes ? Number(params.mes) : mesAtual

  const status = statusValidos.includes(params.status ?? "")
    ? params.status
    : "todos"

  const filtros = {
    ano: Number.isNaN(ano) ? anoAtual : ano,
    mes: Number.isNaN(mes) ? mesAtual : mes,
    status: status as
      | "todos"
      | "pendente"
      | "aprovada"
      | "reprovada"
      | "cancelada",
    colaborador: params.colaborador ?? "",
    equipe: params.equipe ?? "",
  }

  const dashboard = await getFeriasDashboard(filtros)

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
            <BreadcrumbPage>Gestão de Férias</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <GestaoFerias
        colaboradores={dashboard.colaboradores}
        solicitacoes={dashboard.solicitacoes}
        resumo={dashboard.resumo}
        conflitos={dashboard.conflitos}
        filtrosIniciais={filtros}
      />
    </div>
  )
}