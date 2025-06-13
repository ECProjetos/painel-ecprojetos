"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { NavItem } from "./type";

const activeItemStyles =
  "text-blue-600 [&_svg]:text-blue-600 bg-white shadow-sm border dark:bg-blue-950 dark:text-blue-400";

export function NavReports({ items }: { items: NavItem[] }) {
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // verifica se o item tem filhos
          const hasChildren = item.items && item.items.length > 0;

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasChildren ? (
                  // se tiver filhos, cria um collapsible de primeiro nivel
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                          item.isActive && activeItemStyles
                        )}
                      >
                        {item.icon && (
                          <item.icon className="h-4 w-4 text-gray-500" />
                        )}
                        <span>{item.title}</span>
                        {/* gira o icone quando aberto */}
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          // verifica se o subItem também tem filhos ("netos")
                          const hasGrandChildren =
                            subItem.items && subItem.items.length > 0;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {hasGrandChildren ? (
                                // se tiver filhos, cria um collapsible de segundo nivel
                                <Collapsible
                                  key={subItem.title}
                                  defaultOpen={subItem.isActive}
                                  className="group/collapsible"
                                >
                                  <>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                                          subItem.isActive && activeItemStyles
                                        )}
                                      >
                                        <span>{subItem.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {subItem.items?.map((grandChild) => (
                                          <SidebarMenuSubItem
                                            key={grandChild.title}
                                          >
                                            <SidebarMenuSubButton asChild>
                                              <button
                                                onClick={() =>
                                                  router.push(
                                                    grandChild.url || ""
                                                  )
                                                }
                                                className={cn(
                                                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                                                  grandChild.isActive &&
                                                    activeItemStyles
                                                )}
                                              >
                                                {grandChild.title}
                                              </button>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </>
                                </Collapsible>
                              ) : (
                                // se não tiver filhos, botão simples
                                <SidebarMenuSubButton asChild>
                                  <button
                                    onClick={() =>
                                      router.push(subItem.url || "")
                                    }
                                    className={cn(
                                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                                      subItem.isActive && activeItemStyles
                                    )}
                                  >
                                    {subItem.title}
                                  </button>
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  // item sem filhos => botão simples de navegação
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => router.push(item.url || "")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                      item.isActive && activeItemStyles
                    )}
                  >
                    {item.icon && (
                      <item.icon className="h-4 w-4 text-gray-500" />
                    )}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
