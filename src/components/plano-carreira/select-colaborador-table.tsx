'use client';

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAllColaboradores, getColaboradoresByDepartamento } from "@/app/actions/colaboradores";
import { Colaborador } from "@/types/colaboradores";
import { getDepartamentoByID } from "@/app/actions/colaboradores";
import { getUser } from "@/hooks/use-user";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getStatusPlanoCarreira } from "@/app/actions/plano-carreira";

interface statusProps {
    status: string;
    semestre: string;
    created_at?: string | null;
}

export default function AvaliacaoSelectColaboradorTable() {
    const router = useRouter();
    const [lista, setLista] = useState<Colaborador[]>([]);
    const [filtro] = useState("");
    const [loading, setLoading] = useState(true);
    const [nomeDepartamento, setDepartamentoNome] = useState<string>("");
    const pathname = usePathname();
    const [statuses, setStatuses] = useState<Record<string, statusProps>>({});

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

    // Busca colaboradores e seus status
    useEffect(() => {
        async function fetchColaboradoresAndStatuses() {
            if (!nomeDepartamento) return;

            setLoading(true);
            try {
                let colaboradores: Colaborador[] = [];
                if (nomeDepartamento === 'Todos') {
                    colaboradores = await getAllColaboradores();
                } else {
                    colaboradores = await getColaboradoresByDepartamento(nomeDepartamento);
                }
                setLista(colaboradores);

                const statusPromises = colaboradores.map((colaborador) =>
                    getStatusPlanoCarreira(colaborador.id, "hardskills_ti")
                );
                const resolvedStatuses = await Promise.all(statusPromises);

                const newStatuses: Record<string, statusProps> = {};
                colaboradores.forEach((colaborador, index) => {
                    newStatuses[colaborador.id] = {
                        status: resolvedStatuses[index].status,
                        semestre: resolvedStatuses[index].semestre ?? ""
                    };
                });
                setStatuses(newStatuses);
            } catch (err) {
                console.error("Erro ao buscar colaboradores ou status:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchColaboradoresAndStatuses();
    }, [nomeDepartamento]);

    const listaFiltrada = lista.filter((c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="flex flex-col w-full mb-4 mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-left">Colaborador</TableHead>
                        <TableHead className="text-left">Semestre</TableHead>
                        <TableHead className="text-left">Ano</TableHead>
                        <TableHead className="text-left">Status</TableHead>
                        <TableHead className="text-left">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                Carregando...
                            </TableCell>
                        </TableRow>
                    ) : (
                        listaFiltrada.map((colaborador) => {
                            const statusData = statuses[colaborador.id];
                            return (
                                <TableRow key={colaborador.id}>
                                    <TableCell>{colaborador.nome}</TableCell>
                                    <TableCell>{statusData?.semestre || "N/A"}</TableCell>
                                    <TableCell>
                                        2025
                                    </TableCell>
                                    <TableCell>{statusData?.status || "N/A"}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => {
                                                router.push(`${pathname}/${colaborador.id}`);
                                            }}
                                            className="text-blue-500 hover:underline cursor-pointer"
                                        >
                                            Avaliar
                                        </button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
