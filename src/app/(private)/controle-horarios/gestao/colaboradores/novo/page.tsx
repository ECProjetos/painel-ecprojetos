"use client";

import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getAllCargos } from "@/app/actions/get-cargos";

export default function NewColaboradoresPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cargos, setCargos] = useState<any>([]);
  useEffect(() => {
    async function fetchCargos() {
      const cargosData = await getAllCargos();
      setCargos(cargosData);
    }
    fetchCargos();
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
            <BreadcrumbEllipsis />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/gestao/painel-equipes">
                Colaboradores
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Novo Colaborador</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 mt-4">
        <div className="flex items-center align-center justify-between">
          <h1 className="text-2xl font-bold">Novo Colaborador</h1>
        </div>
      </div>
    </div>
  );
}
