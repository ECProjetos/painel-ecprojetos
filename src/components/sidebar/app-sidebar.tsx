"use client";

import { useUserStore } from "@/stores/userStore";
import { usePathname } from "next/navigation";
import { ComponentProps, useEffect } from "react";

import Image from "next/image";

import {
  Briefcase,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  //   Home,
  //   History,
  //   ListPlus,
  //   Calendar,
  //   Send,
  //   LayoutDashboard,
  //   ChartPie,
  //   Rocket,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";

import { NavGeneral } from "./nav-general";

import { roles } from "@/constants/roles";

import { getUser } from "@/hooks/use-user";
import { Button } from "../ui/button";

const createData = (pathname: string) => ({
  navGeneral: [
    {
      title: "Controle de Horários",
      url: "/controle-horarios/inicio",
      icon: Clock,
      isActive: pathname.startsWith("/controle-horarios"),
    },
    {
      title: "Plano de Carreira",
      url: "#",
      icon: Briefcase,
      isActive: pathname.startsWith("/plano-carreira"),
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
      return role; // fallback
  }
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const userRole = user?.role || "";
  // Ensure user data is loaded when sidebar mounts
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (!user) {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
        }
      }
    };

    fetchUserIfNeeded();
  }, [user, setUser]);

  const data = createData(pathname);
  const navData = {
    ...data,
    navGeneral: data.navGeneral.map((item) => ({
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
            <Image src="/images/logo.png" alt="logo" width={32} height={32} />
            {open && (
              <div className="flex flex-col">
                <h1 className="text-sm font-bold">EC Projetos</h1>
                {(() => {
                  const label = getRoleLabel(userRole);
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
        <NavGeneral items={navData.navGeneral} />
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
      <SidebarRail />
    </Sidebar>
  );
}
