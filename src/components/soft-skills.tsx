'use client';

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { SoftSkillsAssessmentType, softSkillsAssessmentSchema } from "@/types/plano-carreira/soft-skills"; // ajuste o path
import { useParams } from "next/navigation";

type Colaborador = {
    id: string;
    nome: string;
};

type SoftSkillsTableProps = {
    habilidades: string[];
    opcoes: string[];
    colaboradores: Colaborador[];
    evaluatorId: string; // Passe o id do avaliador via prop
    onSubmit?: (respostas: SoftSkillsAssessmentType) => void;
};

const fieldNames = [
    "comunicacao",
    "trabalho_em_equipe",
    "proatividade",
    "resolucao_de_problemas",
    "organizacao_de_tempo",
    "pensamento_critico",
    "capricho",
    "nao_medo_desafios",
    "postura_profissional",
    "gentileza_educacao",
    "engajamento_missao_visao",
];

type SoftSkillField = typeof fieldNames[number];


export function SoftSkillsTable({
    habilidades,
    opcoes,
    evaluatorId,
    onSubmit
}: SoftSkillsTableProps) {
    const [respostas, setRespostas] = useState<Partial<Record<SoftSkillField, string>>>({});

    const handleChange = (field: string, value: string) => {
        setRespostas((prev) => ({ ...prev, [field]: value }));
    };

    const params = useParams();

    const colaboradorId = params.id;


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!colaboradorId) {
            alert("Selecione um colaborador.");
            return;
        }
        // Validação Zod
        const dadosParaValidar = {
            ...respostas,
            colaborador_id: colaboradorId,
            evaluator_id: evaluatorId,
        };
        const parseResult = softSkillsAssessmentSchema.safeParse(dadosParaValidar);
        if (!parseResult.success) {
            alert("Por favor, preencha todas as habilidades!");
            console.error("Erro de validação:", parseResult.error.format());

            return;
        }
        if (onSubmit) {
            onSubmit(parseResult.data);
        } else {
            alert(JSON.stringify(parseResult.data, null, 2));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-center">
            <div className="overflow-x-auto w-full flex justify-center">
                <div className="w-full max-w-8xl mx-auto">
                    <Table className="w-full border rounded-xl shadow bg-white">
                        <TableHeader>
                            <TableRow className="bg-blue-50">
                                <TableHead className="text-lg font-bold text-black">Habilidade</TableHead>
                                {opcoes.map((opcao, idx) => (
                                    <TableHead key={idx} className="text-center text-base font-semibold text-black">
                                        {opcao}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {habilidades.map((habilidade, hIdx) => {
                                const field = fieldNames[hIdx];
                                return (
                                    <TableRow key={hIdx}>
                                        <TableCell>{habilidade}</TableCell>
                                        {opcoes.map((_, opIdx) => (
                                            <TableCell key={opIdx} className="text-center">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={field}
                                                        value={(opIdx + 1).toString()}
                                                        checked={respostas[field] === (opIdx + 1).toString()}
                                                        onChange={() => handleChange(field, (opIdx + 1).toString())}
                                                    />
                                                </label>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <Button
                type="submit"
                className="mt-8 w-40 text-white py-3"
            >
                Enviar Avaliação
            </Button>
        </form>
    );
}
