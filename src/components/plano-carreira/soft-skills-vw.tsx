'use client';

import { useEffect, useState } from "react";
import { getAllSoftSkillsAssessments } from "@/app/actions/plano-carreira";
import { useUserStore } from "@/stores/userStore";
import { SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";
import { habilidadesDetalhadas } from "@/constants/soft-skills";
import {
    Card,
    CardHeader,
    CardContent
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    ThumbsDown,
    ThumbsUp,
    Star,
    Smile,
} from "lucide-react";

export function SoftSkillsDashboard() {
    const [avaliacoes, setAvaliacoes] = useState<SoftSkillsAssessmentType[]>([]);
    const idColaborador = useUserStore((state) => state.user?.id);

    const [modalAberto, setModalAberto] = useState(false);
    const [habilidadeSelecionada, setHabilidadeSelecionada] = useState<{
        nome: string;
        descricao: string;
    } | null>(null);

    const getBadgeInfo = (nota: number) => {
        switch (nota) {
            case 1:
                return { label: 'Muito abaixo', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-5 h-5 mr-2" /> };
            case 2:
                return { label: 'Abaixo do esperado', color: 'bg-orange-100 text-orange-800', icon: <ThumbsDown className="w-5 h-5 mr-2" /> };
            case 3:
                return { label: 'Dentro do esperado', color: 'bg-yellow-100 text-yellow-800', icon: <Smile className="w-5 h-5 mr-2" /> };
            case 4:
                return { label: 'Acima do esperado', color: 'bg-blue-100 text-blue-800', icon: <ThumbsUp className="w-5 h-5 mr-2" /> };
            case 5:
                return { label: 'Excelente', color: 'bg-green-100 text-green-800', icon: <Star className="w-5 h-5 mr-2" /> };
            default:
                return { label: 'Sem avaliação', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-5 h-5 mr-2" /> };
        }
    };

    const getDescricaoDetalhada = (label: string, nota: number): string => {
        const habilidade = habilidadesDetalhadas.find(h => h.nome === label);
        if (!habilidade || nota < 1 || nota > 5) return "Descrição não disponível.";
        return habilidade.descricoes[nota - 1];
    };

    const abrirModal = (label: string, nota: number) => {
        const descricao = getDescricaoDetalhada(label, nota);
        setHabilidadeSelecionada({ nome: label, descricao });
        setModalAberto(true);
    };

    useEffect(() => {
        async function fetchSoftSkills() {
            try {
                const all = await getAllSoftSkillsAssessments();
                const minhasAvaliacoes = all.filter(a => a.colaborador_id === idColaborador);
                setAvaliacoes(minhasAvaliacoes);
            } catch (error) {
                console.error(error);
            }
        }

        if (idColaborador) {
            fetchSoftSkills();
        }
    }, [idColaborador]);

    const ultimaAvaliacao = avaliacoes[0];
    const softSkills = ultimaAvaliacao ? [
        { label: "Comunicação", valor: ultimaAvaliacao.comunicacao },
        { label: "Trabalho em equipe", valor: ultimaAvaliacao.trabalho_em_equipe },
        { label: "Proatividade", valor: ultimaAvaliacao.proatividade },
        { label: "Resolução de problemas", valor: ultimaAvaliacao.resolucao_de_problemas },
        { label: "Organização de tempo", valor: ultimaAvaliacao.organizacao_de_tempo },
        { label: "Pensamento crítico", valor: ultimaAvaliacao.pensamento_critico },
        { label: "Capricho", valor: ultimaAvaliacao.capricho },
        { label: "Não ter medo de encarar desafios", valor: ultimaAvaliacao.encarar_desafios },
        { label: "Postura profissional", valor: ultimaAvaliacao.postura_profissional },
        { label: "Gentileza e educação", valor: ultimaAvaliacao.gentileza_e_educacao },
        { label: "Engajamento com a missão e visão da empresa", valor: ultimaAvaliacao.engajamento_missao_visao },
    ] : [];

    return (
        <div className="p-6 flex justify-center">
            <Card className="w-full max-w-7xl p-6 shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold">Avaliação de Soft Skills</h2>
                    <p className="text-muted-foreground text-sm">
                        Última avaliação do colaborador
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {softSkills.map((skill) => {
                        const nota = Number(skill.valor);
                        const { label, color, icon } = getBadgeInfo(nota);

                        return (
                            <Card key={skill.label} className={`shadow-sm ${color}`}>
                                <CardHeader className="text-base font-semibold text-center text-black py-2 px-2">
                                    {skill.label}
                                </CardHeader>
                                <CardContent className="py-4 px-3 space-y-3">
                                    <div className="flex items-center justify-center text-sm font-medium text-center">
                                        {icon}
                                        {label}
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => abrirModal(skill.label, nota)}
                                            className="w-full mt-3"
                                        >
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {habilidadeSelecionada?.nome}
                        </DialogTitle>
                        <DialogDescription>
                            <span className="text-black">{habilidadeSelecionada?.descricao}</span>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div >
    );
}
