import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SelectColaborador from "@/components/select-colaborador";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SearchViewColaboradorPage() {
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
                <Link href="/plano-carreira">
                    <Button className="mb-4">
                        Voltar
                    </Button>
                </Link>
                <SelectColaborador />
            </div>
        </div>
    );
}