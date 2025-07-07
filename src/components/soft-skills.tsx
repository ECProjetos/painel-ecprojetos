'use client';

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import {
    SoftSkillsAssessmentType,
    softSkillsAssessmentSchema,
} from "@/types/plano-carreira/soft-skills";
import { Colaborador } from "@/types/colaboradores";
import { toast } from 'sonner';


type SoftSkillsTableProps = {
    habilidadesDetalhadas: {
        nome: string;
        field: string;
        descricoes: string[];
    }[];
    opcoes: string[];
    colaboradores: Colaborador[];
    evaluatorId: string;
    onSubmit?: (respostas: SoftSkillsAssessmentType) => void;
};

export function SoftSkillsTable({
    habilidadesDetalhadas,
    opcoes,
    evaluatorId,
    onSubmit,
}: SoftSkillsTableProps) {
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const params = useParams();
    const colaboradorId = params.id as string | undefined;

    const handleChange = (field: string, value: string) => {
        setRespostas((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!colaboradorId) {
            toast.error("Colaborador não encontrado!");
            return;
        }

        const dadosParaValidar = {
            colaborador_id: colaboradorId,
            evaluator_id: evaluatorId,
            ...respostas,
        };

        const parseResult = softSkillsAssessmentSchema.safeParse(dadosParaValidar);
        if (!parseResult.success) {
            console.error("Erro de validação:", parseResult.error);
            alert("Por favor, preencha todas as habilidades!");
            return;
        }

        if (onSubmit) {
            toast.success("Avaliação enviada com sucesso!");
            onSubmit(parseResult.data);
        } else {
            alert(JSON.stringify(parseResult.data, null, 2));
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col items-center min-h-screen text-base md:text-lg"
        >
            <div className="w-full flex justify-center">
                <div className="w-full max-w-none mx-auto">
                    <Table className="w-full table-fixed border rounded-xl shadow bg-white">
                        <TableHeader>
                            <TableRow className="bg-blue-50">
                                <TableHead className="w-1/6 text-left px-4 py-2">
                                    Habilidade
                                </TableHead>
                                {opcoes.map((opcao) => (
                                    <TableHead
                                        key={opcao}
                                        className="text-center text-base font-semibold px-2 py-2"
                                    >
                                        {opcao}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {habilidadesDetalhadas.map(({ nome, field, descricoes }) => (
                                <TableRow key={field}>
                                    <TableCell className="font-medium text-gray-800 py-3 px-4 whitespace-normal break-words">
                                        {nome}
                                    </TableCell>

                                    {descricoes.map((desc, idx) => {
                                        const value = String(idx + 1);
                                        const checked = respostas[field] === value;
                                        const metaField = `${field}_meta`;
                                        const metaChecked = respostas[metaField] === value;

                                        return (
                                            <TableCell
                                                key={idx}
                                                className="text-center py-3 px-2 whitespace-normal break-words text-base md:text-lg"
                                            >
                                                <label
                                                    className={`
                                                        cursor-pointer
                                                        flex flex-col items-center justify-center
                                                        text-xs text-center px-2 py-3 rounded border transition
                                                        relative
                                                        ${checked
                                                            ? "bg-blue-100 border-blue-600 text-blue-900 font-semibold shadow"
                                                            : "bg-white border-gray-300 hover:bg-blue-50"
                                                        }
                                                    `}
                                                    style={{ minHeight: 100 }} // Aumentar altura para o botão
                                                >
                                                    <input
                                                        type="radio"
                                                        name={field}
                                                        value={value}
                                                        checked={checked}
                                                        onChange={() => handleChange(field, value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="w-full mb-2">{desc}</span>
                                                    
                                                    <div
                                                        onClick={(e) => {
                                                            e.preventDefault(); // Impede que o clique na meta acione a avaliação
                                                            e.stopPropagation();
                                                            handleChange(metaField, value);
                                                        }}
                                                        className={`
                                                            px-3 py-1 text-xs rounded-full cursor-pointer
                                                            transition-all duration-200 ease-in-out
                                                            ${metaChecked
                                                                ? "bg-blue-300 text-gray-800 font-bold shadow-lg transform scale-105"
                                                                : "bg-gray-400 text-white hover:bg-blue-800 hover:shadow-md"
                                                            }
                                                        `}
                                                    >
                                                        {metaChecked ? 'Meta' : 'Meta'} 
                                                    </div>
                                                </label>
                                            </TableCell>
                                        );  
                                    })}
                                </TableRow> 
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Button type="submit" className="mt-8 w-full text-white py-3">
                Enviar Avaliação
            </Button>
        </form>
    )};  
