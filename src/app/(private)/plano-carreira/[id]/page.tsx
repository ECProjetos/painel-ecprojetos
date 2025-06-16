'use client';

import { useParams } from 'next/navigation';
import { SoftSkillsTable } from "@/components/soft-skills";
import { useUserStore } from "@/stores/userStore";
import { roles } from "@/constants/roles";
import { submitSoftSkillsAssessment } from "@/app/actions/plano-carreira";
import { SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";

const listaDeColaboradores = [
    { id: "f85f7b90-f617-4b6f-930e-913b0c9e79b1", nome: "João Silva" },
    { id: "2", nome: "Maria Oliveira" },
    { id: "3", nome: "Pedro Santos" },
    { id: "4", nome: "Ana Costa" },
    { id: "5", nome: "Lucas Pereira" },
];

const habilidades = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resolução de problemas",
    "Organização de tempo",
    "Pensamento crítico",
    "Capricho",
    "Não medo de desafios",
    "Postura profissional",
    "Gentileza e educação",
    "Engajamento com missão e visão"
];

const opcoes = [
    "Excelente",
    "Bom",
    "Regular",
    "Ruim",
    "Péssimo"
];

export default function AvaliacaoColaboradorPage() {
    const params = useParams();
    const id = params.id;
    const user = useUserStore((state) => state.user);

    const colaborador = listaDeColaboradores.find(colab => colab.id === id);

    async function handleSubmitAvaliacao(respostas: SoftSkillsAssessmentType) {
        await submitSoftSkillsAssessment(respostas);
        alert("Avaliação enviada!");
    }

    if (user?.role === roles.diretor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
                    <h1 className="text-3xl font-bold mb-8 text-center">
                        Avaliando: {colaborador ? colaborador.nome : "Colaborador não encontrado"}
                    </h1>
                    {colaborador && (
                        <SoftSkillsTable
                            habilidades={habilidades}
                            opcoes={opcoes}
                            colaboradores={[colaborador]}
                            evaluatorId={user.id}
                            onSubmit={handleSubmitAvaliacao}
                        />
                    )}
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
