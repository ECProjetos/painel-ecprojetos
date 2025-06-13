"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useUserStore } from "@/stores/userStore";
import Link from "next/link";
import { TimesheetSidebar } from "@/components/sidebar/timesheet-sidebar";

export default function Page() {
  const user = useUserStore((state) => state.user);
  return (
    <SidebarProvider>
      <AppSidebar />
      <TimesheetSidebar />
      <SidebarInset>
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4 pl-0 dark:bg-[#18181B]">
          <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/controle-horarios/inicio">
                        Controle de Horários
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Início</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* Exibe o nome do usuário se estiver logado */}
            {user ? (
              <div>
                <h1 className="text-2xl font-bold mb-4">
                  Bem-vindo, {user.name}
                </h1>
                <p>email: {user.email}</p>
                <p>id: {user.id}</p>
                <p>role: {user.role}</p>
              </div>
            ) : (
              <h1 className="text-2xl font-bold mb-4">Bem-vindo!</h1>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
