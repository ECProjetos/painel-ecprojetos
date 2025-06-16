'use client';
import { useRouter } from "next/navigation";
import { useState } from "react";

const listaDeColaboradores = [
    { id: "f85f7b90-f617-4b6f-930e-913b0c9e79b1", nome: "João Silva" },
    { id: "2", nome: "Maria Oliveira" },
    { id: "3", nome: "Pedro Santos" },
    { id: "4", nome: "Ana Costa" },
    { id: "5", nome: "Lucas Pereira" },
];


export default function AvaliacaoSelectColaborador() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState("");

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const id = e.target.value;
        setColaboradorId(id);
        if (id) {
            router.push(`/plano-carreira/${id}`);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full bordyer dark:bg-[#1c1c20]">
                <h1 className="text-2xl font-bold mb-6 text-center">Selecione o colaborador para avaliar</h1>
                <select
                    className="w-full border rounded px-3 py-2"
                    value={colaboradorId}
                    onChange={handleChange}
                >
                    <option value="">Selecione...</option>
                    {listaDeColaboradores.map(colab => (
                        <option key={colab.id} value={colab.id}>{colab.nome}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
