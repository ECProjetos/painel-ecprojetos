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

import { respostasSchema, RespostasType } from "@/types/plano-carreira/soft-skills"; // ajuste o path

type SoftSkillsTableProps = {
    habilidades: string[];
    opcoes: string[];
    onSubmit?: (respostas: RespostasType) => void;
};

export function SoftSkillsTable({
    habilidades,
    opcoes,
    onSubmit
}: SoftSkillsTableProps) {
    const [respostas, setRespostas] = useState<Partial<RespostasType>>({});

    const handleChange = (habilidadeIdx: number, value: string) => {
        setRespostas((prev) => ({ ...prev, [habilidadeIdx]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validar com zod
        const parseResult = respostasSchema.safeParse(respostas);
        if (!parseResult.success) {
            alert("Por favor, preencha todas as habilidades!");
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
                            {habilidades.map((habilidade, hIdx) => (
                                <TableRow
                                    key={hIdx}
                                    className={hIdx % 2 === 0 ? "bg-gray-50 hover:bg-blue-50 transition" : "bg-white hover:bg-blue-50 transition"}
                                >
                                    <TableCell className="font-medium text-gray-800 py-3">{habilidade}</TableCell>
                                    {opcoes.map((opcao, opIdx) => (
                                        <TableCell key={opIdx} className="text-center">
                                            <label className="inline-flex items-center justify-center cursor-pointer w-8 h-8">
                                                <input
                                                    type="radio"
                                                    name={`habilidade-${hIdx}`}
                                                    value={opcao}
                                                    checked={respostas[hIdx] === opcao}
                                                    onChange={() => handleChange(hIdx, opcao)}
                                                    aria-label={opcao}
                                                    className="accent-blue-600 w-3 h-3 border-2 border-blue-400 "
                                                />
                                            </label>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <Button
                type="submit"
                className="mt-8 w-40 text-white  py-3"
            >
                Enviar Avaliação
            </Button>
        </form>
    );
}
