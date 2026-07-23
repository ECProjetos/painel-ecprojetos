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

const statusValidos = ["todos", "pendente", "aprovada", "reprovada", "cancelada"]

export default async function FeriasPage({ searchParams }: PageProps) {
  const permitido = await isRhFeriasAdmin()

  if (!permitido) {
    redirect("/controle-horarios/inicio")
  }

  const params = searchParams ? await searchParams : {}
  const dataInicioPadrao = getHojeBrasilia()
  const dataFimPadrao = adicionarUmMes(dataInicioPadrao)

  const dataInicio = isDataValida(params.dataInicio)
    ? params.dataInicio
    : dataInicioPadrao

  const dataFimInformada = isDataValida(params.dataFim)
    ? params.dataFim
    : dataFimPadrao

  const dataFim = dataFimInformada < dataInicio
    ? adicionarUmMes(dataInicio)
    : dataFimInformada

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
        filtrosIniciais={filtros}
      />
    </div>
  )
}

function getHojeBrasilia() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const valores = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value]),
  )

  return `${valores.year}-${valores.month}-${valores.day}`
}

function adicionarUmMes(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number)
  const indiceMesDestino = mes
  const anoDestino = ano + Math.floor(indiceMesDestino / 12)
  const mesDestino = indiceMesDestino % 12
  const ultimoDiaMesDestino = new Date(
    anoDestino,
    mesDestino + 1,
    0,
  ).getDate()
  const diaDestino = Math.min(dia, ultimoDiaMesDestino)

  return formatarDataIso(new Date(anoDestino, mesDestino, diaDestino))
}

function isDataValida(data?: string): data is string {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false
  }

  const [ano, mes, dia] = data.split("-").map(Number)
  const dataCriada = new Date(ano, mes - 1, dia)

  return (
    dataCriada.getFullYear() === ano &&
    dataCriada.getMonth() === mes - 1 &&
    dataCriada.getDate() === dia
  )
}

function formatarDataIso(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}
