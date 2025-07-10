// app/plano-carreira/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { SoftSkillsTable } from '@/components/plano-carreira/soft-skills';
import { HardEconoSkillsTable } from '@/components/plano-carreira/hard-skills-econo';
import { TextSubmit } from '@/components/text-submit';
import { useUserStore } from '@/stores/userStore';
import { roles } from '@/constants/roles';
import {
    submitSoftSkillsAssessment, submitHardSkillsEcono,
    submitHardSkillsMg,
    submitHardSkillsTI
} from '@/app/actions/plano-carreira';
import { SoftSkillsAssessmentType } from '@/types/plano-carreira/soft-skills';
import { getAllColaboradores } from '@/app/actions/colaboradores';
import { Colaborador } from '@/types/colaboradores';
import { opcoes } from '@/constants/soft-skills';

import { habilidadesDetalhadas } from '@/constants/soft-skills';

import { hardSkillsEcono } from '@/constants/hard-skills-econo';
import { hardSkillsAmbientais } from '@/constants/hard-skills-mg';
import { HardSkillsMgTable } from '@/components/plano-carreira/hard-skills-mg';
import { HardTISkillsTable } from '@/components/plano-carreira/hard-skills-ti';
import { getDepartamentoByID } from '@/app/actions/colaboradores';
import { getUser } from '@/hooks/use-user';
import { useClientRole } from '@/hooks/use-client-role';
import { hardSkillsTI } from '@/constants/hard-skills-ti';


export default function AvaliacaoColaboradorPage() {
    const params = useParams();
    const colaboradorId = params.id as string | undefined;

    const userId = useUserStore((s) => s.user?.id)!;
    const { role } = useClientRole();
    const isDiretor = role === roles.diretor;
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'soft' | 'hard' | 'feedback'>('soft');
    const [nomeDepartamento, setDepartamentoNome] = useState<string>("");

    // Busca o departamento do usuário logado
    useEffect(() => {
        async function fetchDepartamento() {
            try {
                const user = await getUser();
                if (user) {
                    const departamento = await getDepartamentoByID(user.id);
                    setDepartamentoNome(departamento.nome_departamento);
                }
            } catch (err) {
                console.error("Erro ao buscar departamento:", err);
            }
        }
        fetchDepartamento();
    }, [nomeDepartamento]);

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


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmitHardEcono = (res: any) => {
        submitHardSkillsEcono(res)
            .then(() => alert('Hard skills enviadas!'))
            .catch((error) => {
                console.error("Erro ao enviar hard skills:", error);
                alert("Erro ao enviar hard skills. Por favor, tente novamente.");
            });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmitHardAmbiental = (res: any) => {
        submitHardSkillsMg(res)
            .then(() => alert('Hard skills ambientais enviadas!'))
            .catch((error) => {
                console.error("Erro ao enviar hard skills ambientais:", error);
                alert("Erro ao enviar hard skills ambientais. Por favor, tente novamente.");
            });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmitHardTI = (res: any) => {
        submitHardSkillsTI(res)
            .then(() => alert('Hard skills de TI enviadas!'))
            .catch((error) => {
                console.error("Erro ao enviar hard skills de TI:", error);
                alert("Erro ao enviar hard skills de TI. Por favor, tente novamente.");
            });
    }

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
                    <TabsTrigger value="feedback">Comentários e Encaminhamentos</TabsTrigger>
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
                        {nomeDepartamento === "Departamento de Meio Ambiente e Geoprocessamento" ? (
                            <HardSkillsMgTable
                                habilidadesDetalhadas={hardSkillsAmbientais}
                                opcoes={opcoes}
                                colaboradores={[colaborador]}
                                evaluatorId={userId}
                                onSubmit={handleSubmitHardAmbiental}
                            />
                        ) : nomeDepartamento === "Departamento de TI" ? (
                            <HardTISkillsTable
                                habilidadesDetalhadas={hardSkillsTI}
                                opcoes={opcoes}
                                colaboradores={[colaborador]}
                                evaluatorId={userId}
                                onSubmit={handleSubmitHardTI}
                            />
                        ) : (
                            <HardEconoSkillsTable
                                habilidadesDetalhadas={hardSkillsEcono}
                                opcoes={opcoes}
                                colaboradores={[colaborador]}
                                evaluatorId={userId}
                                onSubmit={handleSubmitHardEcono}
                            />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="feedback">
                    <div className="flex flex-col space-y-4">
                        <TextSubmit />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
