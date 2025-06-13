import { User } from "@supabase/supabase-js";

import {
    Building2,
    Target,
    ClipboardList,
    PieChart,
    Leaf,
    Settings2,
} from "lucide-react";



// Mapeamento de setores para os itens da sidebar
const setorToNavItemMap = {

    Estratégica: {
        title: "Gestão Estratégica",
        url: "#",
        icon: Target,
        items: [
            {
                title: "Empresa 1",
                url: "#",
            },
            {
                title: "Empresa 2",
                url: "#",
            },
        ],
    },
    Mercado: {
        title: "Gestão de Mercado",
        url: "#",
        icon: PieChart,
        items: [
            {
                title: "Empresa 1",
                url: "#",
            },
            {
                title: "Empresa 2",
                url: "#",
            },
        ],
    },
    Operacional: {
        title: "Gestão Operacional",
        url: "#",
        icon: ClipboardList,
        items: [
            {
                title: "Empresa 1",
                url: "#",
            },
            {
                title: "Empresa 2",
                url: "#",
            },
        ],
    },
    Ambiental: {
        title: "Gestão Ambiental",
        url: "/gestao-ambiental",
        icon: Leaf,
        items: [
            {
                title: "Painel Gerencial",
                url: "/gestao-ambiental/dashboard",
            },
            {
                title: "Licenciamento",
                url: '/gestao-ambiental/licenciamento',
                items: [
                    {
                        title: "Painel Geral",
                        url: "/gestao-ambiental/licenciamento/dashboard",
                    },
                    {
                        title: "Coleta de Dados",
                        url: "/gestao-ambiental/licenciamento/coleta-dados",
                    },
                    {
                        title: "Relatórios",
                        url: "/gestao-ambiental/licenciamento/relatorios",
                    },
                    {
                        title: "Mapa Interativo",
                        url: "/gestao-ambiental/licenciamento/mapa-interativo",
                    }
                ]
            },
        ],

    },

}




// Criação de dados para a sidebar
export function createData(_: string, user: User | null) {
    if (!user) {
        window.location.reload();
    }

    const sectors = user?.user_metadata?.sectors || [];

    const navReports = [
        {
            title: "Meus Ativos",
            url: "/meus-ativos",
            icon: Building2,
            items: [
                {
                    title: "Baía Babitonga",
                    url: "/meus-ativos/baia-babitonga",
                },
                {
                    title: "Itajaí - Açu",
                    url: "/meus-ativos/empresa-2"
                },
            ],
        },



        // Adiciona os setores do usuário de forma dinâmica
        ...sectors
            .map((sector: keyof typeof setorToNavItemMap) => setorToNavItemMap[sector] ?? null)
            .filter(Boolean),
    ];

    const navGeneral = [
        {
            title: "Configurações Gerais",
            url: "/geral",
            icon: Settings2,
            items: [
                {
                    title: "Minha Equipe",
                    url: "/geral/equipe",
                },
                {
                    title: "Usuários",
                    url: "/geral/usuarios",
                },
                {
                    title: "Clientes",
                    url: "/geral/clientes",
                },
                {
                    title: "Ativos",
                    url: "/geral/ativos",
                },
                {
                    title: "Laboratórios",
                    url: "/geral/laboratorios",
                },
                {
                    title: "Consultorias",
                    url: "/geral/Consultorias",
                },

            ],
        },
    ];

    return { navReports, navGeneral };
}