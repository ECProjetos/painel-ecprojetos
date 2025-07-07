'use client';

import SelectColaborador from "@/components/select-colaborador";
import { useUserStore } from "@/stores/userStore";
import { roles } from "@/constants/roles"; // Certifique-se de importar os roles corretamente
//import { SoftSkillsDashboard } from "@/components/plano-carreira/soft-skills-vw";
import { FeedbackTable } from "@/components/plano-carreira/feedback-table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";




export default function AvaliacaoSelectColaborador() {
    const role = useUserStore((s) => s.user?.role);
    const isDiretor = role === roles.diretor;



    return (
        <div className="flex flex-col bg-white shadow-lg rounded-2xl p-2 sm:p-4 sm:px-6 lg:px-8 flex-1 min-h-[125vh] border dark:bg-[#1c1c20]">
            <header className="flex h-16 shrink-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/private/controle-horarios/inicio">
                                Controle de Horários
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbPage>Início</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div>
                {isDiretor ? (
                    <SelectColaborador />
                ) : (
                    <FeedbackTable />
                )}
            </div>
        </div>
    );
}
