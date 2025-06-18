"use client";

import { useState, useEffect } from "react";

import { AlocacapPainel } from "@/components/historico/alocacao/painel-alocacao";
import { MarcacaoPainel } from "@/components/historico/marcacao/painel-marcacao";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Folder } from "lucide-react";

import { getInsightsPontoHistorico } from "@/app/actions/time-sheet/clock-controller";
import { useUserStore } from "@/stores/userStore";

export default function ControleHorariosHistoricoPage() {
  const userId = useUserStore((state) => state.user?.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    async function fetchInsights() {
      if (!userId) {
        return;
      }
      try {
        const data = await getInsightsPontoHistorico(userId as string);
        setInsights(data);
      } catch (error) {
        console.error("Erro ao buscar insights:", error);
      }
    }

    fetchInsights();
  }, [userId]);

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
            <BreadcrumbPage>Histórico</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Conteúdo principal */}
      <div className="px-4">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold">
            Histórico de Ponto e Alocação
          </h1>
          <p className="text-gray-600">
            Acomponhe suas marcações e como você alocou seu tempo por projeto
          </p>
        </div>
        <Tabs defaultValue="marcacao" className="w-full">
          <TabsList>
            <TabsTrigger
              className="flex justify-between items-center"
              value="marcacao"
            >
              <Clock /> Marcação do Ponto
            </TabsTrigger>
            <TabsTrigger
              className="flex justify-between items-center"
              value="alocacao"
            >
              <Folder /> Alocação de Tempo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="marcacao">
            {insights ? (
              <MarcacaoPainel insights={insights} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Carregando dados...</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="alocacao">
            <AlocacapPainel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
