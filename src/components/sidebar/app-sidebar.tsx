"use client";

import { useUserStore } from "@/stores/userStore";
import { usePathname } from "next/navigation";
import { ComponentProps } from "react";

import Image from "next/image";

import { logout } from "@/hooks/use-logout";

import {
  Briefcase,
  ClipboardList,
  Clock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ThumbsUpIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";

import { NavGeneral } from "./nav-general";
import { NavDiretor } from "./nav-diretor";

import { roles } from "@/constants/roles";

import { Button } from "../ui/button";
import { NavGestor } from "./nav-gestor";


const createData = (pathname: string, userId?: string) => ({
  navGeneral: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
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
  ],
  navGestor: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
    },
    {
      title: "Plano de Carreira",
      url: "/plano-carreira",
      icon: Briefcase,
      isActive: pathname.startsWith("/plano-carreira"),
      items: [
        {
          title: "Visualizar",
          url: "/plano-carreira/view ",
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
      url: "/enps",
      icon: ClipboardList,
      isActive: pathname.startsWith("/enps"),
    },
    {
      title: "Satisfação do cliente",
      url: "/satisfacao",
      icon: ThumbsUpIcon,
      isActive: pathname.startsWith("/satisfacao"),
    }
  ],
  navDiretor: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
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
  ],
});

function getRoleLabel(role: string) {
  if (!role || role === "authenticated") {
    return null; // tratar como “sem role”
  }
  switch (role) {
    case roles.diretor:
      return "Diretor";
    case roles.gestor:

      return "Gestor";
    case roles.colaborador:
      return "Colaborador";
    default:
      return role; // 
  }
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const userRole = user?.role;
  const id = user?.id;


  const data = createData(pathname, id);
  const navData = {
    ...data,
    navGeneral: data.navGeneral.map((item) => ({
      ...item,
      isActive: item.isActive || pathname.startsWith(item.url),
    })),
    navDiretor: data.navDiretor.map((item) => ({
      ...item,
      isActive: item.isActive || pathname.startsWith(item.url),
    })),
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={
        open
          ? "border-none !min-h-[115vh] pb-3"
          : "border-none !min-h-[115vh] pb-3"
      }
    >
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="logo" width={64} height={72 } />
            {open && (
              <div className="flex flex-col">
                <h1 className="text-sm font-bold">EC Projetos</h1>
                {(() => {
                  const label = getRoleLabel(userRole!);
                  return label ? (
                    <p className="text-xs text-gray-500"> {label} </p>
                  ) : (
                    <Skeleton className="h-3 w-16" />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* Floating rounded toggle button on the edge of sidebar */}
      <div
        className="absolute z-30 "
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
          className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          {open ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar controle de horario e plano de carreira */}
      <SidebarContent className="h-full">
        {userRole === roles.diretor ? (
          <NavDiretor items={navData.navDiretor} />
        ) : userRole === roles.gestor ? (
          <NavGestor items={navData.navGestor} />
        ) : (
          <NavGeneral items={navData.navGeneral} />
        )}
        <Button className="mx-auto w-full mt-10" size="icon" variant="outline" onClick={logout}>
          <LogOut />
        </Button>
      </SidebarContent>

      {/* Add visible toggle button for easier mobile access */}
      <div className="p-2 md:hidden">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={toggleSidebar}
        >
          {open ? (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse sidebar</span>
            </>
          ) : (
            <>
              <PanelLeftOpen className="h-4 w-4" />
              <span>Expand sidebar</span>
            </>
          )}
        </Button>
      </div>

      {/*
      para ajusatar o do footer quando estiver no momento 
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      */}
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
