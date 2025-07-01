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
import { NewProjectForm } from "@/components/projetos/new-project-form";
import { NewProject, Project } from "@/types/projects";
import { toast } from "sonner";
import { getProjectById, updateProject } from "@/app/actions/projects";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjetosPage() {
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : undefined;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Executa as duas requisições em paralelo
        const departamentosData = await getAllDepartments();
        if (projectId) {
          const projectData = await getProjectById(projectId);
          setProject(projectData);
        }
        setDepartamentos(departamentosData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  const handleFormSubmit = async (data: NewProject) => {
    try {
      if (projectId) {
        await updateProject(projectId, data);
        toast("Projeto atualizado com sucesso!");
      } else {
        throw new Error("ID do projeto não fornecido.");
      }
      setTimeout(() => {
        window.location.href = "/controle-horarios/direcao/projetos";
      }, 2000); // Redireciona após 2 segundos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      toast.error("Erro ao atualizar projeto: ", {
        description: error.message,
      });
    }
  };

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
                Projetos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>
              {loading ? <Skeleton className="h-4 w-32" /> : project?.name}
            </BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 ">
        <h1 className="text-2xl font-semibold">
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            `${project?.code} - ${project?.name}`
          )}
        </h1>
        {loading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : (
          <NewProjectForm
            departments={departamentos}
            onSubmit={handleFormSubmit}
            projeto={project}
          />
        )}
      </div>
    </div>
  );
}
