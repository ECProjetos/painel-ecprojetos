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
      <div className="px-4">
        <PontoForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
