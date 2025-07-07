// app/plano-carreira/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { SoftSkillsTable } from '@/components/soft-skills';
import  { HardSkillsTable } from '@/components/hard-skills';

import { useUserStore } from '@/stores/userStore';
import { roles } from '@/constants/roles';
import {    
    submitSoftSkillsAssessment,
} from '@/app/actions/plano-carreira';
import { SoftSkillsAssessmentType } from '@/types/plano-carreira/soft-skills';
import { getAllColaboradores } from '@/app/actions/colaboradores';
import { Colaborador } from '@/types/colaboradores';
import { opcoes } from '@/constants/soft-skills';

import { habilidadesDetalhadas } from '@/constants/soft-skills';



export default function AvaliacaoColaboradorPage() {
    const params = useParams();
    const colaboradorId = params.id as string | undefined;

    const userId = useUserStore((s) => s.user?.id)!;
    const role = useUserStore((s) => s.user?.role);
    const isDiretor = role === roles.diretor;

    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loading, setLoading] = useState(true);

    // tab active: "soft" | "hard" | "feedback"
    const [activeTab, setActiveTab] = useState<'soft' | 'hard' | 'feedback'>('soft');

    useEffect(() => {
        getAllColaboradores()
            .then(setColaboradores)
            .catch(() => setColaboradores([]))
            .finally(() => setLoading(false));
    }, []);

    if (!isDiretor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md border dark:bg-[#1c1c20] text-center">
                    <h1 className="text-2xl font-semibold">
                        Você não tem permissão para acessar esta página.
                    </h1>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Carregando colaboradores…
            </div>
        );
    }

    const colaborador = colaboradores.find((c) => c.id === colaboradorId);
    if (!colaborador) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Colaborador não encontrado.
            </div>
        );
    }

    // Handlers de envio
    const handleSubmitSoft = (res: SoftSkillsAssessmentType) =>
        submitSoftSkillsAssessment(res).then(() => alert('Soft skills enviadas!'));


    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
            <h1 className="text-3xl font-bold mb-4 text-center bg-blue-50 p-4 rounded-lg">
                Avaliação de  <span className="text-blue-700 ">{colaborador.nome}</span>
            </h1>

            {/* --- Tabs --- */}
            <Tabs
                value={activeTab}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onValueChange={(v) => setActiveTab(v as any)}
                className="w-full"
            >
                <TabsList className="mb-6 w-full flex justify-center">
                    <TabsTrigger value="soft">Soft Skills</TabsTrigger>
                    <TabsTrigger value="hard">Hard Skills</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="soft">
                <div className="text-center text-gray-500">
                    <SoftSkillsTable
                        habilidadesDetalhadas={habilidadesDetalhadas}
                        opcoes={opcoes}
                        colaboradores={[colaborador]}
                        evaluatorId={userId}
                        onSubmit={handleSubmitSoft}
                    />
                </div>
                </TabsContent>

                <TabsContent value="hard">
                    <div className="text-center text-gray-500">
                        <HardSkillsTable
                        habilidadesDetalhadas={habilidadesDetalhadas}
                        opcoes={opcoes}
                        colaboradores={[colaborador]}
                        evaluatorId={userId}
                        onSubmit={handleSubmitSoft}
                        />
                    </div>
                    {/* Placeholder para futuras implementações */}
                    {/* Aqui você pode adicionar um componente ou formulário para avaliação de hard skills */}
                </TabsContent>

                <TabsContent value="feedback">
                    <div className="flex flex-col space-y-4">
                        <p>
                            Placeholder
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
