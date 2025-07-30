"use client";

import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {  buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {  PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getAllProjects } from "@/app/actions/projects";
import { TimeSumaryViewProject } from "@/types/projects";
import { ProjectTable } from "@/components/projetos/table";
import { projectColumns } from "@/components/projetos/columns";
import Loading from "@/app/loading";

export default function ProjetosPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<TimeSumaryViewProject[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        toast.error("Erro ao buscar projetos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [refresh]);

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
          <div className="flex items-center space-x-2">
            <Link
              href="/projetos/novo"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Projeto
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loading/>
          </div>
        ) : (
          <ProjectTable
            data={projects}
            columns={projectColumns({
              onUpdate: () => setRefresh((prev) => prev + 1),
            })}
          />
        )}
      </div>
    </div>
  );
}
