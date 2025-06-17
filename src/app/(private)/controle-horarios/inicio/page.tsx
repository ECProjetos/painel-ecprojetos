"use client";

import { PainelPonto } from "@/components/inicio/painel-ponto";
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
      <div className="px-4">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold">Controle de Ponto</h1>
          <p className="text-gray-600">
            Bem vindo de volta, {user ? user.name : null}
          </p>
        </div>
        {user ? (
          <PainelPonto userId={user.id} />
        ) : (
          <div className="text-center text-gray-500">
            <p>Carregando...</p>
          </div>
        )}
      </div>
    </div>
  );
}
