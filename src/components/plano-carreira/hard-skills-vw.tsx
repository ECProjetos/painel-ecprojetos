
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getColaboradorById } from "@/app/actions/colaboradores";
import { getHardSkills } from "@/app/actions/plano-carreira";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Colaborador } from "@/types/colaboradores";
import { HardSkillsContabeisSchema, HardSkillsContabeisType, HardSkillsEconoSchema, HardSkillsEconoType, HardSkillsMeioAmbienteSchema, HardSkillsMeioAmbienteType, HardSkillsTISchema, HardSkillsTIType } from "@/types/plano-carreira/hard-skills";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Meh, Star, ThumbsDown, ThumbsUp } from "lucide-react";

export function HardSkillsVwTable() {
    const params = useParams<{ id: string }>();

    const [colaborador, setColaborador] = useState<Colaborador>();
    const departamento = colaborador?.departamentoId;
    const [hardSkills, setHardskills] = useState<HardSkillsTIType | HardSkillsEconoType | HardSkillsMeioAmbienteType | HardSkillsContabeisType>();
    const [modalAberto, setModalAberto] = useState(false);
    const [habilidadeSelecionada, setHabilidadeSelecionada] = useState<{
        nome: string;
        comentario: string;
    } | null>(null);

    const getDepartamentoLabel = () => {
        switch (departamento) {
            case 1:
                return "hardskills_econo";
            case 2:
                return "RH";
            case 3:
                return "hardskills_mg";
            case 4:
                return "hardskills_financeiro";
            case 5:
                return "hardskills_ti";
            default:
                return "Desconhecido";
        }
    }

    const departamentoLabel = getDepartamentoLabel();

    useEffect(() => {
        const fetchColaborador = async () => {
            if (params?.id) {
                const colaboradorData = await getColaboradorById(params.id);
                setColaborador(colaboradorData);
            }
        };
        fetchColaborador();
    }, [params?.id]);

    useEffect(() => {
        const fetchHardSkills = async () => {
            if (departamentoLabel && departamentoLabel !== "Desconhecido" && departamentoLabel !== "RH") {
                const hardSkillsData = await getHardSkills(params.id, departamentoLabel);
                const schemaMap = {
                    hardskills_econo: HardSkillsEconoSchema,
                    hardskills_mg: HardSkillsMeioAmbienteSchema,
                    hardskills_ti: HardSkillsTISchema,
                    hardskills_financeiro: HardSkillsContabeisSchema,
                };
                const schema = schemaMap[departamentoLabel as keyof typeof schemaMap];
                if (schema) {
                    const parsedHardSkills = schema.parse(hardSkillsData);
                    setHardskills(parsedHardSkills);
                } else {
                    console.error("Schema not found for department:", departamentoLabel);
                }
            }
        };
        fetchHardSkills();
    }, [params.id, departamentoLabel]);

    const formatLabel = (label: string) =>
        label
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

    const skillKeys = hardSkills
        ? Object.keys(hardSkills).filter(
            (key) =>
                !key.endsWith("_meta") &&
                !key.endsWith("_comment") &&
                key !== "colaborador_id" &&
                key !== "evaluator_id" &&
                key !== "created_at"
        )
        : [];

    const totalAtual = skillKeys.reduce((acc, key) => {
        const atual = hardSkills![key as keyof typeof hardSkills];
        return acc + (Number(atual) || 0);
    }, 0);

    const totalMeta = skillKeys.reduce((acc, key) => {
        const meta = (hardSkills as any)[`${key}_meta`];
        return acc + (Number(meta) || 0);
    }, 0);

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
                        <h2 className="text-3xl font-bold">Avaliação de Hard Skills</h2>
                        <p className="text-muted-foreground text-sm">
                            Última avaliação do colaborador
                        </p>
                    </div>
                    <TabsContent value="tabela">
                        <Table >
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[70px] px-5 py-1 ">Skill</TableHead>
                                    <TableHead className="w-[70px] text-center px-5 py-1">Atual</TableHead>
                                    <TableHead className="w-[70px] text-center px-5 py-1">Meta</TableHead>
                                    <TableHead className="w-[140px] px-5 py-1">Comentário</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {skillKeys.length > 0 ? (
                                    <>
                                        <TableRow>
                                            <TableCell className="font-bold px-5">Total</TableCell>
                                            <TableCell className="text-red-800 text-center px-5 py-1 font-bold">
                                                {totalAtual}
                                            </TableCell>
                                            <TableCell className="text-orange-500 text-center px-2 py-1 font-bold">
                                                {totalMeta}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                        {skillKeys.map((key) => {
                                            const atual = hardSkills![key as keyof typeof hardSkills];
                                            const meta = (hardSkills as any)[`${key}_meta`];
                                            const comment = (hardSkills as any)[`${key}_comment`];
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium px-5">
                                                        {formatLabel(key)}
                                                    </TableCell>
                                                    <TableCell className="text-red-800 text-center px-2 py-1">
                                                        {atual}
                                                    </TableCell>
                                                    <TableCell className="text-orange-500 text-center px-2 py-1">
                                                        {meta}
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1">
                                                        {comment}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Nenhum dado disponível.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="dash">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {skillKeys.map((key) => {
                                const atual = hardSkills![key as keyof typeof hardSkills];
                                const nota = Number(atual);
                                const { label, color, icon } = getBadgeInfo(nota);
                                const comment = (hardSkills as any)[`${key}_comment`];

                                return (
                                    <Card key={key} className={`shadow-sm ${color}`}>
                                        <CardHeader className="text-base font-semibold text-center text-black py-2 px-2">
                                            {formatLabel(key)}
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
                                                    onClick={() => abrirModal(formatLabel(key), comment || 'Sem comentário')}
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
        </div>
    )
}
