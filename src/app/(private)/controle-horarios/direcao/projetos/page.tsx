"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Download, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ProjetosPage() {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/inicio">
                Controle de Horários
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/direcao/projetos">
                Direção
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Projetos</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 mt-4">
        <div className="flex items-center align-center justify-between">
          <h1 className="text-2xl font-bold">Painel de Gestão de Projetos</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              onClick={alert.bind(null, "Funcionalidade em desenvolvimento")}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Link
              href="/controle-horarios/direcao/projetos/novo"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Projeto
            </Link>
          </div>
        </div>
        {/* {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando colaboradores...</p>
          </div>
        ) : (
          <ColaboradoresTable colaboradores={colaboradores} />
        )} */}
      </div>
    </div>
  );
}
