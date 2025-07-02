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
import { Colaborador, ColaboradorUpdate } from "@/types/colaboradores";
import {
  updateColaboradorPassword,
  getColaboradorById,
  updateColaborador,
  updateColaboradorEmail,
} from "@/app/actions/colaboradores";
import { toast } from "sonner";
import { EditColaboradorForm } from "@/components/colaboradores/user-form";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTable } from "@/components/skeleton-table";
import Link from "next/link";

export default function EditColaboradorPage() {
  const params = useParams();
  const [cargos, setCargos] = useState<{ id: number; nome: string }[]>([]);
  const [departamentos, setDepartamentos] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cargosData, departamentosData, colaboradorData] =
          await Promise.all([
            getAllCargos(),
            getAllDepartments(),
            getColaboradorById(params.id as string),
          ]);

        setCargos(cargosData);
        setDepartamentos(departamentosData);
        const mapped = {
          id: colaboradorData.id,
          nome: colaboradorData.name, // name → nome
          email: colaboradorData.email,
          role: colaboradorData.role,
          cargoId: colaboradorData.cargo_id, // cargo_id → cargoId
          status: colaboradorData.status,
          working_hours_per_day: colaboradorData.working_hours_per_day,
          departamentoId: colaboradorData.departamentoId, // já está correto
        };
        setColaborador(mapped);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  const handleFormSubmit = async (values: ColaboradorUpdate) => {
    try {
      await updateColaborador(params.id as string, values);
      toast.success("Colaborador atualizado com sucesso!");
      setTimeout(() => {
        window.location.href = "/controle-horarios/gestao/colaboradores";
      }, 2000); // Redireciona após 2 segundos
    } catch (error) {
      toast.error("Erro ao atualizar colaborador.");
      console.error("Erro ao atualizar colaborador:", error);
    }
  };

  return (
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
            <BreadcrumbEllipsis />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/controle-horarios/gestao/colaboradores">
                  Colaboradores
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>
              {loading ? <Skeleton className="h-4 w-32" /> : colaborador?.nome}
            </BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            `Editar Colaborador ${colaborador?.nome}`
          )}
        </h1>
        {loading ? (
          <SkeletonTable />
        ) : (
          <EditColaboradorForm
            initialValues={colaborador!}
            cargos={cargos}
            departamentos={departamentos}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </div>
  );
}
