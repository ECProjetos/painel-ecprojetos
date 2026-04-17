import IndicadoresForm from "@/components/indicadores/indicadores-form"
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
import { BarChart3, ClipboardCheck, FileText } from "lucide-react"

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

        <TabsContent value="indicadores" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">Indicadores</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Aqui vamos mostrar o dashboard com os indicadores calculados por
              colaborador, equipe, período e média geral da empresa.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Indicador de Esforço</p>
                <p className="mt-2 text-2xl font-semibold">--</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Indicador de Prazo</p>
                <p className="mt-2 text-2xl font-semibold">--</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Indicador Individual (IDI)</p>
                <p className="mt-2 text-2xl font-semibold">--</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Aqui vamos listar os relatórios gerados, com opção de visualizar,
              baixar e futuramente enviar automaticamente.
            </p>

            <div className="mt-6 rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Nenhum relatório gerado ainda.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}