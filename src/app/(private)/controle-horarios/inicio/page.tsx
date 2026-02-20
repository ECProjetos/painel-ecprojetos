"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TabGestor } from "@/components/tab-gestor";
import { useClientRole } from "@/hooks/use-client-role";
import { roles } from "@/constants/roles";
import { TabGeneral } from "@/components/tab-general";
import Loading from "@/app/loading";

export default function Page() {
  const { role } = useClientRole();
  const isGestor = role === roles.gestor || role === roles.diretor;

  return (
    <div className="flex flex-col bg-white shadow-lg rounded-2xl p-2 sm:p-4 sm:px-6 lg:px-8 flex-1 min-h-[125vh] border dark:bg-[#1c1c20]">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/inicio/detalhado">
                Controle de Horários
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Início</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {role ? (
        isGestor ? <TabGestor /> : <TabGeneral />
      ) : (
        <Loading />
      )}
    </div>
  );
}
