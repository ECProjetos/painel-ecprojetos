"use client";

import { sendTimeEntry } from "@/app/actions/time-sheet/send-time-entry";
import PontoForm from "@/components/inicio/ponto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TimeEntryFormValues } from "@/types/time-sheet/time-entrys-alocation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { toast } from "sonner";

export default function Page() {
  const onSubmit = async (data: TimeEntryFormValues) => {
    const result = await sendTimeEntry(data);
    if (result.success) {
      toast.success("Ponto registrado com sucesso!");
    } else {
      toast.error("Erro ao registrar ponto: " + result.error, {
        description: "Verifique os dados e tente novamente.",
      });
    }
  };
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
        <Tabs >
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
            <PontoForm onSubmit={onSubmit} />
          </TabsContent>
          <TabsContent value="banco">
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-4">Banco de Horas</h2>
              <p>Em desenvolvimento...</p>
            </div>
          </TabsContent>
          <TabsContent value="relatorios">
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-4">Relatórios</h2>
              <p>Em desenvolvimento...</p>
            </div>
          </TabsContent>
          <TabsContent value="relatorio">
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-4">Meu Relatório</h2>
              <p>Em desenvolvimento...</p>
            </div>
          </TabsContent>
          <TabsContent value="configuracoes">
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-4">Configurações</h2>
              <p>Em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div >
  );
}
