import IndicadoresForm from "@/components/indicadores/indicadores-form"
import IndicadoresEvolucaoForm from "@/components/indicadores/indicadores-evolucao-form"
import IndicadoresDashboard from "@/components/indicadores/indicadores-dashboard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, ClipboardCheck, FileText, TrendingUp } from "lucide-react"
import IndicadoresRelatorios from "@/components/indicadores/indicadores-relatorios"

export default function IndicadoresDeDesempenhoPage() {
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
            <BreadcrumbPage>Indicadores de Desempenho</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <Tabs defaultValue="avaliacao" className="w-full">
        <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="avaliacao"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-base font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <ClipboardCheck className="mr-2 h-5 w-5 text-rose-400" />
            Avaliação
          </TabsTrigger>

          <TabsTrigger
            value="evolucao"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-base font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <TrendingUp className="mr-2 h-5 w-5 text-amber-500" />
            Evolução
          </TabsTrigger>

          <TabsTrigger
            value="indicadores"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-base font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <BarChart3 className="mr-2 h-5 w-5 text-emerald-500" />
            Indicadores
          </TabsTrigger>

          <TabsTrigger
            value="relatorios"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-base font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <FileText className="mr-2 h-5 w-5 text-violet-500" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacao" className="mt-4">
          <IndicadoresForm />
        </TabsContent>

        <TabsContent value="evolucao" className="mt-4">
          <IndicadoresEvolucaoForm />
        </TabsContent>

        <TabsContent value="indicadores" className="mt-4">
          <IndicadoresDashboard />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4">
          <IndicadoresRelatorios />
        </TabsContent>
      </Tabs>
    </div>
  )
}