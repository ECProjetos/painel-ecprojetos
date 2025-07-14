'use client';

import SelectColaborador from "@/components/select-colaborador";
import { roles } from "@/constants/roles";
import { FeedbackTable } from "@/components/plano-carreira/feedback-table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useClientRole } from "@/hooks/use-client-role";

export default function AvaliacaoSelectColaborador() {
    const { role, loading } = useClientRole();
    const isDiretor = role === roles.diretor;

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="flex flex-col bg-white shadow-lg rounded-2xl p-2 sm:p-4 sm:px-6 lg:px-8 flex-1 min-h-[125vh] border dark:bg-[#1c1c20]">
            <header className="flex h-16 shrink-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/private/plano-carreira">
                                Plano de Carreira
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbPage>Início</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div>
                {isDiretor ? (
                    <div>
                        <SelectColaborador acao="avaliar" />
                    </div>
                ) : (
                    <FeedbackTable />
                )}
            </div>
        </div >
    );
}

