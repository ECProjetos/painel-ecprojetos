"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import TimeSheetList from "@/components/historico/time-sheet-list";

export default function ControleHorariosHistoricoPage() {
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
        <TimeSheetList />
      </div>
    </div>
  );
}
