"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { getAllColaboradores } from "@/app/actions/colaboradores";
import { useEffect, useState } from "react";
import { ColaboradorView } from "@/types/colaboradores";
import { ColaboradoresTable } from "@/components/colaboradores/colaboradores-table";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorView[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchColaboradores() {
      try {
        const data = await getAllColaboradores();
        setColaboradores(data);
      } catch (error) {
        console.error("Erro ao buscar colaboradores:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchColaboradores();
  }, []);

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
              <BreadcrumbLink href="/controle-horarios/gestao/painel-equipes">
                Gestão
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Colaboradores</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 mt-4">
        <div className="flex items-center align-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Colaboradores</h1>
          <Link
            href="/controle-horarios/gestao/colaboradores/novo"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Colaborador
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando colaboradores...</p>
          </div>
        ) : (
          <ColaboradoresTable colaboradores={colaboradores} />
        )}
      </div>
    </div>
  );
}
// This page is for managing collaborators in the time control system.
// It includes a breadcrumb navigation and a button to add new collaborators.
