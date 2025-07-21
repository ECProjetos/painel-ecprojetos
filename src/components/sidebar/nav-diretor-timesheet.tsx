"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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

const activeItemStyles =
  "text-blue-600 [&_svg]:text-blue-600 bg-white shadow-sm border dark:bg-blue-950 dark:text-blue-400";

export function NavDiretorTimesheet({
  items,
  openItem,
  setOpenItem,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    subTitle?: string;
    items?: {
      title: string;
      url: string;
      isActive?: boolean;
      subTitle?: string;
    }[];
  }[];
  openItem: string | null;
  setOpenItem: (item: string | null) => void;
}) {
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={openItem === item.title || item.isActive}
            onOpenChange={(isOpen) => setOpenItem(isOpen ? item.title : null)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                        item.isActive && activeItemStyles
                      )}
                    >
                      {item.icon && (
                        <item.icon className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{item.title}</span>
                      <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {item.subTitle}
                      </span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <button
                              onClick={() => router.push(subItem.url)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                                subItem.isActive && activeItemStyles
                              )}
                            >
                              <span>{subItem.title}</span>
                              {subItem.subTitle && (
                                <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  {subItem.subTitle}
                                </span>
                              )}
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => router.push(item.url)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                    item.isActive && activeItemStyles
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4 text-gray-500" />}
                  <span>{item.title}</span>
                  <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {item.subTitle}
                  </span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
