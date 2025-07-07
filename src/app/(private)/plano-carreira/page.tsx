'use client';

import SelectColaborador from "@/components/select-colaborador";
import { useUserStore } from "@/stores/userStore";
import { roles } from "@/constants/roles"; // Certifique-se de importar os roles corretamente
import { SoftSkillsDashboard } from "@/components/soft-skills-vw";

export default function AvaliacaoSelectPage() {
    const role = useUserStore((s) => s.user?.role);
    const isDiretor = role === roles.diretor;
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getColaboradoresByDepartamento, getDepartamentoByID } from "@/app/actions/colaboradores";
import { Colaborador } from "@/types/colaboradores";
import { getUser } from "@/hooks/use-user";


export default function AvaliacaoSelectColaborador() {
    const router = useRouter();
    const [colaboradorId, setColaboradorId] = useState("");
    const [lista, setLista] = useState<Colaborador[]>([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(true);
    const [nomeDepartamento, setDepartamentoNome] = useState<string>("");
    
    // Busca o departamento do usuário logado
    useEffect(() => {
        async function fetchDepartamento() {
            try {
                const user = await getUser();
                if(user){
                    const departamento = await getDepartamentoByID(user.id);    
                    setDepartamentoNome(departamento.nome_departamento);
                }
            } catch (err) {
                console.error("Erro ao buscar departamento:", err); 
            }
        }
        fetchDepartamento();
    }, [nomeDepartamento]);

    useEffect(() => {
        async function fetchColaboradores() {
            try {   
                const colaboradores = await getColaboradoresByDepartamento(nomeDepartamento);
                setLista(colaboradores);
                } catch (err) {
                    console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchColaboradores();
    }, [nomeDepartamento    ]);

    // Filtra em tempo real pelo nome
    const listaFiltrada = lista.filter((c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleCardClick = (id: string) => {
        setColaboradorId(id);
        router.push(`/plano-carreira/${id}`);
    };

    return (
        <div>
            {isDiretor ? (
                <SelectColaborador />
            ) : (
                <SoftSkillsDashboard />
            )}
        </div>
    );
}
