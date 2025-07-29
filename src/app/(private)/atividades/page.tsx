"use client";

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
import { AtividadeView } from "@/types/atidades";
import {  PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AtividadeTable } from "@/components/atividades/table";
import { atividadeColumns } from "@/components/atividades/columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PainelMacroprocessos } from "@/components/atividades/macroprocessos/painel-macroprocessos";
import { getMacroprocessos } from "@/app/actions/activity-hierarchy/macroprocesso";
import { getProcessos } from "@/app/actions/activity-hierarchy/processos";
import { Macroprocesso } from "@/types/activity-hierarchy/macroprocesso";
import { PainelProcessos } from "@/components/atividades/processos/painel-processos";
import { Processo } from "@/types/activity-hierarchy/processo";
import { PainelSubProcessos } from "@/components/atividades/subprocessos/painel-processos";
import { SubProcesso } from "@/types/activity-hierarchy/sub-processo";
import { getSubProcessos } from "@/app/actions/activity-hierarchy/subprocesso";

export default function ProjetosPage() {
  
  //datas
  const [atividades] = useState<AtividadeView[]>([]);
  const [macroprocessos, setMacroprocessos] = useState<Macroprocesso[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [subprocessos, setSubprocessos] = useState<SubProcesso[]>([]);

  // refresh state to trigger re-fetching
  const [refresehMacroprocessos, setRefresehMacroprocessos] =
    useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refresh, setRefresh] = useState<number>(0);

  //loadings
  const [fetchingMacroprocessos, setFetchingMacroprocessos] = useState(false);

  // fetch macroprocessos
  useEffect(() => {
    setFetchingMacroprocessos(true);
    const fetchMacroprocessos = async () => {
      try {
        const data = await getMacroprocessos();
        setMacroprocessos(data);
      } catch (error) {
        console.error("Erro ao buscar macroprocessos:", error);
        toast.error(
          "Erro ao buscar macroprocessos. Tente novamente mais tarde."
        );
      } finally {
        setFetchingMacroprocessos(false);
      }
    };
    fetchMacroprocessos();
  }, [refresehMacroprocessos]);

  useEffect(() => {
    setFetchingMacroprocessos(true);
    const fetchProcessos = async () => {
      try {
        const data = await getProcessos();
        setProcessos(data);
      } catch (error) {
        console.error("Erro ao buscar macroprocessos:", error);
        toast.error(
          "Erro ao buscar macroprocessos. Tente novamente mais tarde."
        );
      } finally {
        setFetchingMacroprocessos(false);
      }
    };
    fetchProcessos();
  }, [refresehMacroprocessos]);
  
  useEffect(() => {
    setFetchingMacroprocessos(true);
    const fetchSubProcessos = async () => {
      try {
        const data = await getSubProcessos();
        setSubprocessos(data);
      } catch (error) {
        console.error("Erro ao buscar subprocessos:", error);
        toast.error(
          "Erro ao buscar subprocessos. Tente novamente mais tarde."
        );
      } finally {
        setFetchingMacroprocessos(false);
      }
    };
    fetchSubProcessos();
  }, [refresehMacroprocessos]);

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
      <div className="flex h-16 shrink-0 items-center gap-2 ">
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
      <div className="space-y-4 w-full">
        <h1 className="text-2xl font-semibold">
          Visão Geral de Processos e Atividades
        </h1>
        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="w-full bg-gray-50 border-b-2 mb-4">
            <TabsTrigger
              value="macroprocessos"
              onClick={() => {
                setRefresehMacroprocessos((prev) => prev + 1);
              }}
            >
              Macroprocessos
            </TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="subprocessos">Sub-Processos</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>
          <TabsContent value="macroprocessos">
            <PainelMacroprocessos
              loading={fetchingMacroprocessos}
              onUpdate={() => setRefresehMacroprocessos((prev) => prev + 1)}
              data={macroprocessos}
            />
          </TabsContent>
          <TabsContent value="processos">
            <PainelProcessos
              loading={fetchingMacroprocessos}
              onUpdate={() => setRefresehMacroprocessos((prev) => prev + 1)}
              data={processos}
            />
          </TabsContent>
          <TabsContent value="subprocessos">
            <PainelSubProcessos
              loading={fetchingMacroprocessos}
              onUpdate={() => setRefresehMacroprocessos((prev) => prev + 1)}
              data={subprocessos}
            />
          </TabsContent>

          <TabsContent value="atividades">
            <div className="flex items-center align-center justify-between">
              <div className="flex items-center space-x-2">
                <Link
                  href="/controle-horarios/direcao/atividades/novo"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Atividade
                </Link>
              </div>
            </div>
              <AtividadeTable
                data={atividades}
                columns={atividadeColumns({
                  onUpdate: () => setRefresh((prev) => prev + 1),
                })}
              />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
