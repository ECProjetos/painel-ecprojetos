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
import { NewAtividadeForm } from "@/components/atividades/new-atividades-form";
import { createAtividade } from "@/app/actions/atividades";
import { NewAtividade } from "@/types/atidades";
import { toast } from "sonner";

export default function AtividadesPage() {
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        //Executa as duas requisições em paralelo
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

  const handleFormSubmit = async (data: NewAtividade) => {
    try {
      await createAtividade(data);
      toast("Atividade criado com sucesso!");
      setTimeout(() => {
        window.location.href = "/controle-horarios/direcao/atividades";
      }, 2000);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro ao criar atividade:", error);
      toast.error("Erro ao criar atividade: ", {
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
                Atividades
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Nova Atividade</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 ">
        <h1 className="text-2xl font-semibold">Novo Atividade</h1>
        {loading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : (
          <NewAtividadeForm
            departments={departamentos}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </div>
  );
}
