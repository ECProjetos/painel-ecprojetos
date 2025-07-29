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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getAllDepartments } from "@/app/actions/get-departamentos";
import {  Atividade } from "@/types/atidades";
import { getAtividadeById } from "@/app/actions/atividades";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTable } from "@/components/skeleton-table";

export default function AtividadePage() {
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const atividadeId = params.id ? parseInt(params.id as string) : undefined;
  const [atividade, setAtividade] = useState<Atividade | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Executa as duas requisições em paralelo
        const departamentosData = await getAllDepartments();
        if (atividadeId) {
          const atividadeData = await getAtividadeById(atividadeId);
          setAtividade(atividadeData);
        }
        setDepartamentos(departamentosData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [atividadeId]);

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
              <BreadcrumbLink href="/controle-horarios/direcao/projetos">
                Atividades
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>
              {loading ? <Skeleton className="h-4 w-32" /> : atividade?.name}
            </BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 ">
        <h1 className="text-2xl font-semibold">
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            `${atividade?.name} - ${
              atividade?.department_id
                ? departamentos.find(
                    (dep) => dep.id === atividade.department_id
                  )?.name
                : "Departamento não encontrado"
            }`
          )}
        </h1>
        {loading ? (
          <SkeletonTable />
        ) : (
       <>Nada</>
        )}
      </div>
    </div>
  );
}
