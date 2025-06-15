// app/(private)/controle-horarios/inicio/page.tsx
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
import { useUserStore } from "@/stores/userStore";

export default function Page() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
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
      </div>

      {/* Conteúdo principal */}
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}</h1>
        <p className="mt-2">email: {user?.email}</p>
        <p>id: {user?.id}</p>
        <p>role: {user?.role}</p>
      </div>
    </div>
  );
}
