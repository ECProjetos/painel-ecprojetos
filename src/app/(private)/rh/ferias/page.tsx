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
    dataInicio?: string
    dataFim?: string
    status?: string
    colaborador?: string
    equipe?: string
  }>
}

const statusValidos = [
  "todos",
  "pendente",
  "aprovada",
  "reprovada",
  "cancelada",
]

function dataHojeBrasilia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function periodoPadrao() {
  const hoje = dataHojeBrasilia()
  const [ano, mes] = hoje.split("-").map(Number)
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()

  return {
    dataInicio: `${ano}-${String(mes).padStart(2, "0")}-01`,
    dataFim: `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`,
  }
}

function dataIsoValida(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [ano, mes, dia] = value.split("-").map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  )
}

export default async function FeriasPage({ searchParams }: PageProps) {
  const permitido = await isRhFeriasAdmin()

  if (!permitido) {
    redirect("/controle-horarios/inicio")
  }

  const params = searchParams ? await searchParams : {}
  const padrao = periodoPadrao()

  let dataInicio = dataIsoValida(params.dataInicio)
    ? params.dataInicio!
    : padrao.dataInicio
  let dataFim = dataIsoValida(params.dataFim)
    ? params.dataFim!
    : padrao.dataFim

  if (dataFim < dataInicio) {
    ;[dataInicio, dataFim] = [dataFim, dataInicio]
  }

  const status = statusValidos.includes(params.status ?? "")
    ? params.status
    : "todos"

  const filtros = {
    dataInicio,
    dataFim,
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
        pendencias={dashboard.pendencias}
        resumo={dashboard.resumo}
        conflitos={dashboard.conflitos}
        programacao={dashboard.programacao}
        alertasVencimento={dashboard.alertasVencimento}
        podeEditarProgramacao={dashboard.podeEditarProgramacao}
        filtrosIniciais={filtros}
      />
    </div>
  )
}
