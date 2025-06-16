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

type SoftSkillsTableProps = {
    habilidades: string[];
    opcoes: string[];
    onSubmit?: (respostas: { [key: number]: string }) => void;
};

export function SoftSkillsTable({
    habilidades,
    opcoes,
    onSubmit
}: SoftSkillsTableProps) {
    const [respostas, setRespostas] = useState<{ [key: number]: string }>({});

    const handleChange = (habilidadeIdx: number, value: string) => {
        setRespostas((prev) => ({ ...prev, [habilidadeIdx]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(respostas);
        } else {
            alert(JSON.stringify(respostas, null, 2));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-center">
            <div className="overflow-x-auto w-full flex justify-center">
                <div className="w-full max-w-8xl mx-auto">
                    <Table className="w-full border rounded-xl shadow bg-white">
                        <TableHeader>
                            <TableRow className="bg-blue-50">
                                <TableHead className="text-lg font-bold text-blue-900">Habilidade</TableHead>
                                {opcoes.map((opcao, idx) => (
                                    <TableHead key={idx} className="text-center text-base font-semibold text-blue-800">
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
                                                    value={(opIdx + 1).toString()}
                                                    checked={respostas[hIdx] === (opIdx + 1).toString()}
                                                    onChange={() => handleChange(hIdx, (opIdx + 1).toString())}
                                                    aria-label={opcao}
                                                    className="accent-blue-600 w-5 h-5 border-2 border-blue-400 focus:ring-2 focus:ring-blue-400"
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
                className="mt-8 w-48 text-white text-lg py-3 transition"
            >
                Enviar Avaliação
            </Button>
        </form>
    );
}
