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
import { getAllCargos } from "@/app/actions/get-cargos";
import { getAllDepartments } from "@/app/actions/get-departamentos";
import { NewColaboradorForm } from "@/components/colaboradores/new-user-form";
import { NewColaborador } from "@/types/colaboradores";
import { createColaborador } from "@/app/actions/colaboradores";
import { toast } from "sonner";

export default function NewColaboradoresPage() {
  const [cargos, setCargos] = useState<{ id: number; nome: string }[]>([]);
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Executa as duas requisições em paralelo
        const [cargosData, departamentosData] = await Promise.all([
          getAllCargos(),
          getAllDepartments(),
        ]);

        setCargos(cargosData);
        setDepartamentos(departamentosData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // no NewColaboradoresPage / componente que usa o form
  const handleFormSubmit = async (values: NewColaborador) => {
    try {
      await createColaborador(
        values.nome,
        values.email,
        values.cargoId,
        values.departamentoId,
        values.role,
        values.working_hours_per_day,
        values.status,
        values.password
      );
      // se o servidor quiser devolver, por exemplo, o id do novo user:
      toast.success("Colaborador criado com sucesso!");
      setTimeout(() => {
        window.location.href = "/controle-horarios/gestao/colaboradores";
      }, 2000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Erro ao criar colaborador:", err);
      toast.error(err.message || "Erro ao criar colaborador. Tente novamente.");
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/controle-horarios/inicio">
                Controle de Horários
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbEllipsis />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/controle-horarios/gestao/painel-equipes">
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </div>
        ) : (
          <NewColaboradorForm
            cargos={cargos}
            departamentos={departamentos}
            onSubmit={(values) => {
              handleFormSubmit(values);
            }}
          />
        )}
      </div>
    </div>
  );
}
