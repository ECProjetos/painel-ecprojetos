'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SoftSkillsTable } from "@/components/soft-skills";
import { useUserStore } from "@/stores/userStore";
import { roles } from "@/constants/roles";

const habilidades = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resolução de problemas",
    "Organização de tempo",
    "Pensamento crítico",
    "Capricho",
    "Não ter medo de encarar desafios",
    "Postura profissional",
    "Gentileza e educação",
    "Engajamento com a missão e visão da empresa",
];

const opcoes = [
    "1 - Muito abaixo do esperado",
    "2 - Abaixo do esperado",
    "3 - Dentro do esperado",
    "4 - Acima do esperado",
    "5 - Excelente",
];


export default function Page() {
    const user = useUserStore((state) => state.user)
    const userRole = user?.role;

    if (userRole === roles.diretor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
                    <h1 className="text-3xl font-bold mb-8 text-center">
                        Avaliação Comportamental
                    </h1>
                    <Tabs defaultValue="soft-skills" className="w-full">
                        <TabsList className="w-full flex justify-center mb-6">
                            <TabsTrigger value="soft-skills">Soft Skills</TabsTrigger>
                            <TabsTrigger value="hard-skills">Hard Skills</TabsTrigger>
                            <TabsTrigger value="feedback">Comentários</TabsTrigger>
                        </TabsList>
                        <TabsContent value="soft-skills">
                            <SoftSkillsTable habilidades={habilidades} opcoes={opcoes} />
                        </TabsContent>
                        <TabsContent value="hard-skills">
                            <div className="text-center text-gray-600 p-8">
                                Conteúdo de Hard Skills (em breve!)
                            </div>
                        </TabsContent>
                        <TabsContent value="feedback">
                            <div className="text-center text-gray-600 p-8">
                                Área de Feedback (em breve!)
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20] flex items-center justify-center">
                <h1 className="text-2xl font-semibold text-center">
                    Você não tem permissão para acessar esta página.
                </h1>
            </div>
        </div>
    );
}
