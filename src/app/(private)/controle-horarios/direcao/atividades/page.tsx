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
import { AtividadeView } from "@/types/atidades";
import { Download, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAllAtividades } from "@/app/actions/atividades";
import { AtividadeTable } from "@/components/atividades/table";
import { atividadeColumns } from "@/components/atividades/columns";

export default function ProjetosPage() {
  const [loading, setLoading] = useState(true);
  const [atividades, setAtividaes] = useState<AtividadeView[]>([]);
  const [refresh, setRefresh] = useState<number>(0);

  useEffect(() => {
    async function fetchAtividades() {
      try {
        const data = await getAllAtividades();
        setAtividaes(data);
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        toast.error("Erro ao buscar atividades. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchAtividades();
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
              <BreadcrumbLink href="/controle-horarios/direcao/atividades">
                Direção
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Atividades</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="space-y-4 mt-4">
        <div className="flex items-center align-center justify-between">
          <h1 className="text-2xl font-bold">Painel de Gestão de Atividades</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              onClick={() => {
                toast.success("Funcionalidade em desenvolvimento");
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Link
              href="/controle-horarios/direcao/atividades/novo"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Atividade
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando atividades...</p>
          </div>
        ) : (
          <AtividadeTable
            data={atividades}
            columns={atividadeColumns({
              onUpdate: () => setRefresh((prev) => prev + 1),
            })}
          />
        )}
      </div>
    </div>
  );
}
