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
import { createProject } from "@/app/actions/projects";
import { NewProject } from "@/types/projects";
import { toast } from "sonner";
export default function ProjetosPage() {
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Executa as duas requisições em paralelo
        const departamentosData = await getAllDepartments();

        setDepartamentos(departamentosData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFormSubmit = async (data: NewProject) => {
    console.log("Submissão do formulário recebida:", data);
    try {
      await createProject(data);
      toast("Projeto criado com sucesso!");
      setTimeout(() => {
        window.location.href = "/projetos";
      }, 2000); // Redireciona após 1 segundo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast.error("Erro ao criar projeto: ", {
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
            <BreadcrumbPage>Novo Projeto</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 ">
        <h1 className="text-2xl font-semibold">Novo Projeto</h1>
        {loading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : (
          <NewProjectForm
            departments={departamentos}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </div>
  );
}
