'use client';

import { useEffect, useState } from "react";
import { getAllSoftSkillsAssessments } from "@/app/actions/plano-carreira";
import { SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";
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
    Meh,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SoftSkillsDashboard() {
    const [avaliacoes, setAvaliacoes] = useState<SoftSkillsAssessmentType[]>([]);
    const idColaborador = useParams<{ id: string }>();
    const [modalAberto, setModalAberto] = useState(false);
    const [habilidadeSelecionada, setHabilidadeSelecionada] = useState<{
        nome: string;
        comentario: string;
    } | null>(null);

    const getBadgeInfo = (nota: number) => {
        switch (nota) {
            case 1:
                return { label: 'Muito abaixo', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-5 h-5 mr-2" /> };
            case 2:
                return { label: 'Abaixo do esperado', color: 'bg-orange-100 text-orange-800', icon: <ThumbsDown className="w-5 h-5 mr-2" /> };
            case 3:
                return { label: 'Na média', color: 'bg-yellow-100 text-yellow-800', icon: <Meh className="w-5 h-5 mr-2" /> };
            case 4:
                return { label: 'Acima do esperado', color: 'bg-green-100 text-green-800', icon: <ThumbsUp className="w-5 h-5 mr-2" /> };
            case 5:
                return { label: 'Excelente', color: 'bg-green-300 text-green-800', icon: <Star className="w-5 h-5 mr-2" /> };
            default:
                return { label: 'Sem avaliação', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-5 h-5 mr-2" /> };
        }
    };

    const abrirModal = (label: string, comentario: string) => {
        setHabilidadeSelecionada({ nome: label, comentario });
        setModalAberto(true);
    };

    useEffect(() => {
        async function fetchSoftSkills() {
            try {
                const all = await getAllSoftSkillsAssessments();
                const minhasAvaliacoes = all.filter(a => a.colaborador_id === idColaborador.id);
                setAvaliacoes(minhasAvaliacoes);
            } catch (error) {
                console.error(error);
            }
        }

        fetchSoftSkills();
    }, [idColaborador]);

    const ultimaAvaliacao = avaliacoes[0];
    const softSkills = ultimaAvaliacao ? [
        { label: "Comunicação", valor: ultimaAvaliacao.comunicacao, meta: ultimaAvaliacao.comunicacao_meta, comment: ultimaAvaliacao.comunicacao_comment },
        { label: "Trabalho em equipe", valor: ultimaAvaliacao.trabalho_em_equipe, meta: ultimaAvaliacao.trabalho_em_equipe_meta, comment: ultimaAvaliacao.trabalho_em_equipe_comment },
        { label: "Proatividade", valor: ultimaAvaliacao.proatividade, meta: ultimaAvaliacao.proatividade_meta, comment: ultimaAvaliacao.proatividade_comment },
        { label: "Resolução de problemas", valor: ultimaAvaliacao.resolucao_de_problemas, meta: ultimaAvaliacao.resolucao_de_problemas_meta, comment: ultimaAvaliacao.resolucao_de_problemas_comment },
        { label: "Organização de tempo", valor: ultimaAvaliacao.organizacao_de_tempo, meta: ultimaAvaliacao.organizacao_de_tempo_meta, comment: ultimaAvaliacao.organizacao_de_tempo_comment },
        { label: "Pensamento crítico", valor: ultimaAvaliacao.pensamento_critico, meta: ultimaAvaliacao.pensamento_critico_meta, comment: ultimaAvaliacao.pensamento_critico_comment },
        { label: "Capricho", valor: ultimaAvaliacao.capricho, meta: ultimaAvaliacao.capricho_meta, comment: ultimaAvaliacao.capricho_comment },
        { label: "Não ter medo de encarar desafios", valor: ultimaAvaliacao.encarar_desafios, meta: ultimaAvaliacao.encarar_desafios_meta, comment: ultimaAvaliacao.encarar_desafios_comment },
        { label: "Postura profissional", valor: ultimaAvaliacao.postura_profissional, meta: ultimaAvaliacao.postura_profissional_meta, comment: ultimaAvaliacao.postura_profissional_comment },
        { label: "Gentileza e educação", valor: ultimaAvaliacao.gentileza_e_educacao, meta: ultimaAvaliacao.gentileza_e_educacao_meta, comment: ultimaAvaliacao.gentileza_e_educacao_comment },
        { label: "Engajamento com a missão e visão da empresa", valor: ultimaAvaliacao.engajamento_missao_visao, meta: ultimaAvaliacao.engajamento_missao_visao_meta, comment: ultimaAvaliacao.engajamento_missao_visao_comment },
    ] : [];

    return (
        <div className="p-6 flex justify-center">
            <Card className="w-full max-w-7xl p-6 shadow-lg">
                <Tabs defaultValue='tabela'>
                    <TabsList className="mb-6 flex gap-4">
                        <TabsTrigger value="dash" className="text-lg font-semibold">
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="tabela" className="text-lg font-semibold">
                            Tabela
                        </TabsTrigger>
                    </TabsList>
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold">Avaliação de Soft Skills</h2>
                        <p className="text-muted-foreground text-sm">
                            Última avaliação do colaborador
                        </p>
                    </div>
                    <TabsContent value="dash">
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
                                                    onClick={() => abrirModal(skill.label, skill.comment || 'Sem comentário')}
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
                    </TabsContent >
                    <TabsContent value="tabela">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Skill</TableHead>
                                    <TableHead className="text-center">Nota</TableHead>
                                    <TableHead className="text-center">Meta</TableHead>
                                    <TableHead>Comentário</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {softSkills.map((skill) => (
                                    <TableRow key={skill.label}>
                                        <TableCell className="font-medium">{skill.label}</TableCell>
                                        <TableCell className="text-red-800 text-center">{skill.valor}</TableCell>
                                        <TableCell className="text-orange-500 text-center">{skill.meta}</TableCell>
                                        <TableCell>{skill.comment}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </Card>

            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {habilidadeSelecionada?.nome}
                        </DialogTitle>
                        <DialogDescription>
                            <span className="text-black">{habilidadeSelecionada?.comentario}</span>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div >
    );
}