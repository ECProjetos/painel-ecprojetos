// app/components/sidebar/timesheet-sidebar.tsx
"use client";

import { useUserStore } from "@/stores/userStore";
import { usePathname } from "next/navigation";
import { ComponentProps, useEffect, useState } from "react";

import {
  Home,
  History,
  ListPlus,
  Calendar,
  Send,
  LayoutDashboard,
  ChartPie,
  Rocket,
} from "lucide-react";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

import { NavColaborador } from "./nav-colaborador";
import { NavGestor } from "./nav-gestor";
import { NavDiretor } from "./nav-diretor";

import { roles } from "@/constants/roles";
import { getUser } from "@/hooks/use-user";

const createData = (
  pathname: string,
  isGestor: boolean,
  isDiretor: boolean
) => ({
  navColaborador: [
    {
      title: "Início",
      url: "/controle-horarios/inicio",
      icon: Home,
      isActive: pathname.startsWith("/controle-horarios/inicio"),
    },
    {
      title: "Histórico",
      url: "/controle-horarios/historico",
      icon: History,
      isActive: pathname.startsWith("/controle-horarios/historico"),
    },
    {
      title: "Alocar Horas",
      url: "/controle-horarios/alocar-horas",
      icon: ListPlus,
      isActive: pathname.startsWith("/controle-horarios/alocar-horas"),
    },
    {
      title: "Calendário",
      url: "/controle-horarios/calendario",
      icon: Calendar,
      isActive: pathname.startsWith("/controle-horarios/calendario"),
    },
    {
      title: "Solicitar Ausência",
      url: "#",
      icon: Send,
      isActive: false,
      subTitle: "Em Breve",
    },
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      isActive: false,
      subTitle: "Em Breve",
    },
  ],
  navGestor:
    isGestor || isDiretor
      ? [
          {
            title: "Gestão",
            url: "/controle-horarios/gestao/painel-equipes",
            icon: ChartPie,
            isActive: pathname.startsWith("/controle-horarios/gestao"),
            items: [
              {
                title: "Painel de Equipes",
                url: "/controle-horarios/gestao/painel-equipes",
                isActive: pathname.startsWith(
                  "/controle-horarios/gestao/painel-equipes"
                ),
              },
              {
                title: "Painel de Projetos",
                url: "/controle-horarios/gestao/painel-projetos",
                isActive: pathname.startsWith(
                  "/controle-horarios/gestao/painel-projetos"
                ),
              },
              {
                title: "Colaboradores",
                url: "/controle-horarios/gestao/colaboradores",
                isActive: pathname.startsWith(
                  "/controle-horarios/gestao/colaboradores"
                ),
              },
              {
                title: "Inconsistências",
                url: "/controle-horarios/gestao/inconsistencias",
                isActive: pathname.startsWith(
                  "/controle-horarios/gestao/inconsistencias"
                ),
              },
              {
                title: "Calendário",
                url: "/controle-horarios/gestao/calendario",
                isActive: pathname.startsWith(
                  "/controle-horarios/gestao/calendario"
                ),
              },
            ],
          },
        ]
      : [],
  navDiretor: isDiretor
    ? [
        {
          title: "Direção",
          url: "/controle-horarios/direcao/projetos",
          icon: Rocket,
          isActive: pathname.startsWith("/controle-horarios/direcao"),
          items: [
            {
              title: "Projetos",
              url: "/controle-horarios/direcao/projetos",
              isActive: pathname.startsWith(
                "/controle-horarios/direcao/projetos"
              ),
            },
            {
              title: "Atividades",
              url: "/controle-horarios/direcao/atividades",
              isActive: pathname.startsWith(
                "/controle-horarios/direcao/atividades"
              ),
            },
          ],
        },
      ]
    : [],
});

export function TimesheetSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isGestor, setIsGestor] = useState(false);
  const [isDiretor, setIsDiretor] = useState(false);

  // Carrega dados do usuário e define flags de gestor/diretor
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (!user) {
        const userData = await getUser();
        if (!userData) return; // abort if no user
        setUser(userData);
        setIsGestor(userData.role === roles.gestor);
        setIsDiretor(userData.role === roles.diretor);
      } else {
        setIsGestor(user.role === roles.gestor);
        setIsDiretor(user.role === roles.diretor);
      }
    };
    fetchUserIfNeeded();
  }, [user, setUser]);

  const data = createData(pathname, isGestor, isDiretor);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="absolute h-full border-none !min-h-[115vh]"
    >
      <SidebarContent className="fixed h-full">
        <NavColaborador items={data.navColaborador} />
        {data.navGestor.length > 0 && <NavGestor items={data.navGestor} />}
        {data.navDiretor.length > 0 && <NavDiretor items={data.navDiretor} />}
      </SidebarContent>
    </Sidebar>
  );
}
