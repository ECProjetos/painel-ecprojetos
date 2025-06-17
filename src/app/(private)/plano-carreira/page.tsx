// app/plano-carreira/page.tsx
'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAllColaboradores } from "@/app/actions/colaboradores";
import { Colaborador } from "@/types/colaboradores";


export default function AvaliacaoSelectColaborador() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState("");
    const [lista, setLista] = useState<Colaborador[]>([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchColaboradores() {
            try {
                const colaboradores = await getAllColaboradores();
                setLista(colaboradores);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchColaboradores();
    }, []);

    // Filtra em tempo real pelo nome
    const listaFiltrada = lista.filter((c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleCardClick = (id: string) => {
        setColaboradorId(id);
        router.push(`/plano-carreira/${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
            <div className="max-w-full mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-6 h-full">
                <h1 className="text-3xl font-bold mb-4 text-center">
                    Selecione o colaborador para avaliar
                </h1>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="🔍 Buscar colaborador..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                </div>

                {loading ? (
                    // Skeleton simples
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6)
                            .fill(0)
                            .map((_, i) => (
                                <div
                                    key={i}
                                    className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                                />
                            ))}
                    </div>
                ) : listaFiltrada.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listaFiltrada.map((colab) => (
                            <div
                                key={colab.id}
                                onClick={() => handleCardClick(colab.id)}
                                className={`flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg cursor-pointer transition ${colaboradorId === colab.id
                                    ? "ring-2 ring-blue-400"
                                    : ""
                                    }`}
                            >
                                <div className="flex-shrink-0">
                                    {/** Se tiver URL de avatar:
                   <Image
                     src={colab.avatarUrl}
                     width={48}
                     height={48}
                     alt={colab.nome}
                     className="rounded-full"
                   />
                   */}
                                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold">
                                        {colab.nome.charAt(0)}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        {colab.nome}
                                    </h2>
                                    {/** Se tiver cargo ou e-mail:
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {colab.cargo || colab.email}
                  </p>
                  **/}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        Nenhum colaborador encontrado para “{filtro}”.
                    </p>
                )}
            </div>
        </div>
    );
}
