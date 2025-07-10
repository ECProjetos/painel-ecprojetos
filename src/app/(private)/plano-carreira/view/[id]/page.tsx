/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { getColaboradorById } from "@/app/actions/colaboradores";
import { useEffect, useState } from "react";
import { Colaborador } from "@/types/colaboradores";
import { HardSkillsTIType, HardSkillsTISchema } from "@/types/plano-carreira/hard-skills";
import { getHardSkills } from "@/app/actions/plano-carreira";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList } from "@radix-ui/react-tabs";
import { SoftSkillsDashboard } from "@/components/plano-carreira/soft-skills-vw";
import { TabsContent, TabsTrigger } from "@/components/ui/tabs";

export default function ViewColaboradorPage() {
    const params = useParams<{ id: string }>();
    const [colaborador, setColaborador] = useState<Colaborador>();
    const [hardSkillsTI, setHardskillsTI] = useState<HardSkillsTIType>();

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
            const hardSkillsData = await getHardSkills(params.id, "hardskills_ti");
            const parsedHardSkills = HardSkillsTISchema.parse(hardSkillsData);
            setHardskillsTI(parsedHardSkills);
        };
        fetchHardSkills();
    }, [params.id]);

    // Função para exibir label amigável
    const formatLabel = (label: string) =>
        label
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

    // Gera as chaves das skills base
    const skillKeys = hardSkillsTI
        ? Object.keys(hardSkillsTI).filter(
            (key) =>
                !key.endsWith("_meta") &&
                !key.endsWith("_comment") &&
                key !== "colaborador_id" &&
                key !== "evaluator_id" &&
                key !== "created_at"
        )
        : [];

    return (

        <div className="m-10">
            <div className="flex flex-row items-center gap-4 m-15 mx-18 ">
                <span className="text-2xl font-semibold">Plano de carreira {colaborador?.nome}</span>
                <Select>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Selecione uma data" />
                    </SelectTrigger>
                    <SelectContent>
                        {hardSkillsTI?.created_at ? (
                            <SelectItem value={hardSkillsTI.created_at}>
                                {new Date(hardSkillsTI.created_at).toLocaleDateString("pt-BR")}
                            </SelectItem>
                        ) : (
                            // Apenas renderize nada se não houver data, ou coloque um aviso fora do Select
                            null
                        )}
                    </SelectContent>
                </Select>
                {!hardSkillsTI?.created_at && (
                    <div className="text-sm text-muted-foreground px-2">Nenhuma data disponível</div>
                )}
            </div>
            <Tabs>
                <TabsList className="mb-4">
                    <TabsTrigger value="hard" className="text-lg font-semibold">
                        Hard Skills
                    </TabsTrigger>
                    <TabsTrigger value="soft" className="text-lg font-semibold">
                        Soft Skills
                    </TabsTrigger>
                </TabsList>
                <div className="rounded-md border overflow-x-auto px-4 ">
                    <TabsContent value="hard">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[70px] px-2 py-1 ">Skill</TableHead>
                                    <TableHead className="w-[70px] text-center px-2 py-1">Atual</TableHead>
                                    <TableHead className="w-[70px] text-center px-2 py-1">Meta</TableHead>
                                    <TableHead className="w-[140px] px-2 py-1">Comentário</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {skillKeys.length > 0 ? (
                                    skillKeys.map((key) => {
                                        const atual = hardSkillsTI![key as keyof typeof hardSkillsTI];
                                        const meta = (hardSkillsTI as any)[`${key}_meta`];
                                        const comment = (hardSkillsTI as any)[`${key}_comment`];
                                        return (
                                            <TableRow key={key}>
                                                <TableCell className="font-medium">
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
                                    })
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
                    {/* Soft Skills Tab */}
                    <TabsContent value="soft">
                        <SoftSkillsDashboard />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
