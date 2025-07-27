'use client';

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAllColaboradores, getColaboradoresByDepartamento } from "@/app/actions/colaboradores";
import { Colaborador } from "@/types/colaboradores";
import { getDepartamentoByID } from "@/app/actions/colaboradores";
import { getUser } from "@/hooks/use-user";

interface acaoProps {
    acao: string
}

export default function AvaliacaoSelectColaborador({ acao }: acaoProps) {
    const router = useRouter();
    const [colaboradorId] = useState("");
    const [lista, setLista] = useState<Colaborador[]>([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(true);
    const [nomeDepartamento, setDepartamentoNome] = useState<string>("");
    const pathname = usePathname();

    // Busca o departamento do usuário logado
    useEffect(() => {
        async function fetchDepartamento() {
            try {
                const user = await getUser();
                if (user) {
                    const departamento = await getDepartamentoByID(user.id);
                    setDepartamentoNome(departamento.nome_departamento);
                }
            } catch (err) {
                console.error("Erro ao buscar departamento:", err);
            }
        }
        fetchDepartamento();
    }, []);

    useEffect(() => {
        async function fetchColaboradores() {
            try {
                let colaboradores: Colaborador[] = [];
                if (nomeDepartamento === 'Todos') {
                    colaboradores = await getAllColaboradores();
                } else {
                    colaboradores = await getColaboradoresByDepartamento(nomeDepartamento);
                }
                setLista(colaboradores);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchColaboradores();
    }, [nomeDepartamento]);

    const listaFiltrada = lista.filter((c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleCardClick = (id: string) => {
        const basePath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        router.push(`${basePath}/${id}`);
    };

    return (
        <div className="max-w-full mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-6 h-full">
            <h1 className="text-3xl font-bold mb-4 text-center">
                Selecione o colaborador para {acao}
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
                                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold">
                                    {colab.nome.charAt(0)}
                                </div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    {colab.nome}
                                </h2>
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
    );
}
