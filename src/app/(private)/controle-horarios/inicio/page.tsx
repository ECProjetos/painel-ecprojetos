"use client"

import BancoHorasPage from "@/components/inicio/banco-horas"
import { ColaboradoresPage } from "@/components/inicio/colaboradores_page"
import PontoForm from "@/components/inicio/ponto"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs"
import RelatorioColaborador from "@/components/inicio/relatorio-colaborador"

export default function Page() {
  return (
    <div className="flex flex-col bg-white shadow-lg rounded-2xl p-2 sm:p-4 sm:px-6 lg:px-8 flex-1 min-h-[125vh] border dark:bg-[#1c1c20]">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/private/controle-horarios/inicio">
                Controle de Horários
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Início</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Conteúdo principal */}
      <div className="mt-10">
        <Tabs defaultValue="ponto">
          <TabsList className="flex border-gray-200 bg-white gap-1 px-4 pt-2 mx-4">
            <TabsTrigger
              value="ponto"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              📝 Registro de ponto
            </TabsTrigger>
            <TabsTrigger
              value="banco"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              ⏰ Banco de horas
            </TabsTrigger>
            <TabsTrigger
              value="relatorios"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              📊 Relatórios
            </TabsTrigger>
            <TabsTrigger
              value="relatorio"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              👤 Meu Relatório
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              className="
      px-6 py-3 text-md font-medium text-gray-600 border-b-2 border-transparent bg-white
      data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
      transition
      rounded-t-md
      outline-none
      focus-visible:ring-2 focus-visible:ring-blue-100
    "
            >
              ⚙️ Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ponto">
            <PontoForm />
          </TabsContent>
          <TabsContent value="banco">
            <BancoHorasPage />
          </TabsContent>
          <TabsContent value="relatorios">
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-4">Relatórios</h2>
              <p>Em desenvolvimento...</p>
            </div>
          </TabsContent>
          <TabsContent value="relatorio">
            <RelatorioColaborador />
          </TabsContent>
          <TabsContent value="configuracoes">
            <ColaboradoresPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
