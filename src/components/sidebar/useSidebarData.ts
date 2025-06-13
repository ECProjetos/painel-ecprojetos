"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createData } from "./createData";
import { NavItem } from "./type";


function markActiveItems(items: NavItem[], pathname: string): NavItem[] {
  return items.map((item) => ({
    ...item,
    isActive: item.url !== "#" && pathname.startsWith(item.url || ""),
    items: item.items?.map((sub) => ({
      ...sub,
      isActive: sub.url !== "#" && pathname.startsWith(sub.url || ""),
      items: sub.items?.map((grand) => ({
        ...grand,
        isActive: grand.url !== "#" && pathname.startsWith(grand.url || ""),
      })),
    })),
  }));
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSidebarData(user: any) {
  const pathname = usePathname();

  const [navReports, setNavReports] = useState<NavItem[]>([]);
  const [navGeneral, setNavGeneral] = useState<NavItem[]>([]);

  const markActiveItemsMemoized = useCallback(
    (items: NavItem[]) => markActiveItems(items, pathname),
    [pathname]
  );

  // Carrega os itens da sidebar apenas quando o usuário estiver disponível
  useEffect(() => {
    if (!user) return; // Se o usuário não estiver disponível, não faz nada
    const { navReports, navGeneral } = createData("", user);
    if (navReports) setNavReports(navReports);
    if (navGeneral) setNavGeneral(navGeneral);
  }, [user]); // <- Agora espera o usuário carregar

  // Atualiza os itens ativos sempre que o pathname mudar
  useEffect(() => {
    setNavReports((prev) => markActiveItemsMemoized(prev));
  }, [pathname, markActiveItemsMemoized]);

  return {
    navReports,
    navGeneral,
  };
}
