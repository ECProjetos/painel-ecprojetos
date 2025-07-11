/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getColaboradorById } from "@/app/actions/colaboradores";
import { getHardSkills } from "@/app/actions/plano-carreira";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Colaborador } from "@/types/colaboradores";
import { HardSkillsContabeisSchema, HardSkillsContabeisType, HardSkillsEconoSchema, HardSkillsEconoType, HardSkillsMeioAmbienteSchema, HardSkillsMeioAmbienteType, HardSkillsTISchema, HardSkillsTIType } from "@/types/plano-carreira/hard-skills";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";




export function HardSkillsVwTable() {
    const params = useParams<{ id: string }>();

    const [colaborador, setColaborador] = useState<Colaborador>();
    const departamento = colaborador?.departamentoId;
    const [hardSkills, setHardskills] = useState<HardSkillsTIType | HardSkillsEconoType | HardSkillsMeioAmbienteType | HardSkillsContabeisType>();


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
    console.log("Departamento Label:", departamentoLabel);


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

    // Função para exibir label amigável
    const formatLabel = (label: string) =>
        label
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

    // Gera as chaves das skills base
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
    {
        return (
            <Table >
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
                            const atual = hardSkills![key as keyof typeof hardSkills];
                            const meta = (hardSkills as any)[`${key}_meta`];
                            const comment = (hardSkills as any)[`${key}_comment`];
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
        )
    }
}