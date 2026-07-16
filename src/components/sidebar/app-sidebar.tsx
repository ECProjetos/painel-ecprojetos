"use client"

import { useUserStore } from "@/stores/userStore"
import { usePathname } from "next/navigation"
import { ComponentProps } from "react"
import Image from "next/image"
import { logout } from "@/hooks/use-logout"

import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Clock,
  LogOut,
  LucideNotebook,
  NotebookPen,
  NotepadText,
  PanelLeftClose,
  PanelLeftOpen,
  ThumbsUpIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import { Skeleton } from "@/components/ui/skeleton"
import { NavGeneral } from "./nav-general"
import { NavDiretor } from "./nav-diretor"
import { NavGestor } from "./nav-gestor"
import { roles } from "@/constants/roles"
import { Button } from "../ui/button"

const createData = (pathname: string, userId?: string) => ({
  navGeneral: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
    },
    {
      title: "Indicadores",
      url: "/indicadores-de-desempenho",
      icon: BarChart3,
      isActive: pathname.startsWith("/indicadores-de-desempenho"),
    },
    {
      title: "Plano de Carreira",
      url: "/plano-carreira",
      icon: Briefcase,
      isActive: pathname.startsWith("/plano-carreira"),
      items: [
        {
          title: "Visualizar",
          url: `/plano-carreira/view/${userId ?? ""}`,
          isActive: pathname.startsWith("/plano-carreira/view"),
        },
      ],
    },
    {
      title: "Feedback Interno",
      url: "/feedback-interno/responder",
      icon: ClipboardList,
      isActive: pathname.startsWith("/feedback-interno/responder"),
    },
    {
      title: "Solicitação de Férias",
      url: "/rh/minhas-ferias",
      icon: CalendarPlus,
      isActive: pathname.startsWith("/rh/minhas-ferias"),
    },
  ],

  navGestor: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
    },
    {
      title: "Indicadores",
      url: "/indicadores-de-desempenho",
      icon: BarChart3,
      isActive: pathname.startsWith("/indicadores-de-desempenho"),
    },
    {
      title: "Plano de Carreira",
      url: "/plano-carreira",
      icon: Briefcase,
      isActive: pathname.startsWith("/plano-carreira"),
      items: [
        {
          title: "Visualizar",
          url: "/plano-carreira/view",
          isActive: pathname.startsWith("/plano-carreira/view"),
        },
        {
          title: "Avaliar",
          url: "/plano-carreira/avaliar",
          isActive: pathname.startsWith("/plano-carreira/avaliar"),
        },
      ],
    },
    {
      title: "Feedback interno",
      url: "/feedback-interno",
      icon: ClipboardList,
      isActive: pathname.startsWith("/feedback-interno"),
      items: [
        {
          title: "Responder feedbacks",
          url: "/feedback-interno/responder",
          isActive: pathname.startsWith("/feedback-interno/responder"),
        },
        {
          title: "Histórico e gestão",
          url: "/feedback-interno",
          isActive: pathname === "/feedback-interno",
        },
      ],
    },
    {
      title: "Satisfação do cliente",
      url: "/satisfacao",
      icon: ThumbsUpIcon,
      isActive: pathname.startsWith("/satisfacao"),
    },
    {
      title: "Inventário",
      url: "/inventario",
      icon: LucideNotebook,
      isActive: pathname.startsWith("/inventario"),
    },
    {
      title: "Solicitação de Férias",
      url: "/rh/minhas-ferias",
      icon: CalendarPlus,
      isActive: pathname.startsWith("/rh/minhas-ferias"),
    },
  ],

  navDiretor: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
    },
    {
      title: "Indicadores",
      url: "/indicadores-de-desempenho",
      icon: BarChart3,
      isActive: pathname.startsWith("/indicadores-de-desempenho"),
    },
    {
      title: "Plano de Carreira",
      url: "/plano-carreira",
      icon: Briefcase,
      isActive: pathname.startsWith("/plano-carreira"),
      items: [
        {
          title: "Visualizar",
          url: "/plano-carreira/view",
          isActive: pathname.startsWith("/plano-carreira/view"),
        },
        {
          title: "Avaliar",
          url: "/plano-carreira/avaliar",
          isActive: pathname.startsWith("/plano-carreira/avaliar"),
        },
      ],
    },
    {
      title: "Satisfação do cliente",
      url: "/satisfacao",
      icon: ThumbsUpIcon,
      isActive: pathname.startsWith("/satisfacao"),
    },
    {
      title: "Feedback interno",
      url: "/feedback-interno",
      icon: ClipboardList,
      isActive: pathname.startsWith("/feedback-interno"),
      items: [
        {
          title: "Responder feedbacks",
          url: "/feedback-interno/responder",
          isActive: pathname.startsWith("/feedback-interno/responder"),
        },
        {
          title: "Histórico e gestão",
          url: "/feedback-interno",
          isActive: pathname === "/feedback-interno",
        },
      ],
    },
    {
      title: "Projetos",
      url: "/projetos",
      icon: NotebookPen,
      isActive: pathname.startsWith("/projetos"),
    },
    {
      title: "Atividades",
      url: "/atividades",
      icon: NotepadText,
      isActive: pathname.startsWith("/atividades"),
    },
    {
      title: "Inventário",
      url: "/inventario",
      icon: LucideNotebook,
      isActive: pathname.startsWith("/inventario"),
    },
    {
      title: "Solicitação de Férias",
      url: "/rh/minhas-ferias",
      icon: CalendarPlus,
      isActive: pathname.startsWith("/rh/minhas-ferias"),
    },
  ],
})

function getRoleLabel(role: string) {
  if (!role || role === "authenticated") {
    return null
  }

  switch (role) {
    case roles.diretor:
      return "Diretor"
    case roles.gestor:
      return "Gestor"
    case roles.colaborador:
      return "Colaborador"
    default:
      return role
  }
}

export function AppSidebar({
  temAcessoFerias = false,
  ...props
}: ComponentProps<typeof Sidebar> & {
  temAcessoFerias?: boolean
}) {
  const { open, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const user = useUserStore((state) => state.user)
  const userRole = user?.role
  const id = user?.id

  const data = createData(pathname, id)

  if (temAcessoFerias) {
    const feriasItem = {
      title: "Gestão de Férias",
      url: "/rh/ferias",
      icon: CalendarDays,
      isActive: pathname.startsWith("/rh/ferias"),
    }

    data.navGeneral = [...data.navGeneral, feriasItem]
    data.navGestor = [...data.navGestor, feriasItem]
    data.navDiretor = [...data.navDiretor, feriasItem]
  }

  const navData = {
    ...data,
    navGeneral: data.navGeneral.map((item) => ({
      ...item,
      isActive: item.isActive || pathname.startsWith(item.url),
    })),
    navGestor: data.navGestor.map((item) => ({
      ...item,
      isActive: item.isActive || pathname.startsWith(item.url),
    })),
    navDiretor: data.navDiretor.map((item) => ({
      ...item,
      isActive: item.isActive || pathname.startsWith(item.url),
    })),
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-none !min-h-[115vh] pb-3"
    >
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="logo" width={64} height={72} />

            {open && (
              <div className="flex flex-col">
                <h1 className="text-sm font-bold">EC Projetos</h1>

                {(() => {
                  const label = getRoleLabel(userRole ?? "")

                  return label ? (
                    <p className="text-xs text-gray-500">{label}</p>
                  ) : (
                    <Skeleton className="h-3 w-16" />
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <div
        className="absolute z-30"
        style={{
          left: open
            ? "calc(var(--sidebar-width) - 14px)"
            : "calc(var(--sidebar-width-icon) - 14px)",
          top: "4rem",
        }}
      >
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200"
          aria-label="Toggle sidebar"
        >
          {open ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      <SidebarContent className="h-full">
        {userRole === roles.diretor ? (
          <NavDiretor items={navData.navDiretor} />
        ) : userRole === roles.gestor ? (
          <NavGestor items={navData.navGestor} />
        ) : (
          <NavGeneral items={navData.navGeneral} />
        )}

        <Button
          className="mx-auto mt-10 w-full"
          size="icon"
          variant="outline"
          onClick={logout}
        >
          <LogOut />
        </Button>
      </SidebarContent>

      <div className="p-2 md:hidden">
        <Button
          variant="outline"
          className="flex w-full items-center justify-center gap-2"
          onClick={toggleSidebar}
        >
          {open ? (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Recolher menu</span>
            </>
          ) : (
            <>
              <PanelLeftOpen className="h-4 w-4" />
              <span>Expandir menu</span>
            </>
          )}
        </Button>
      </div>

      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}