"use client";

import * as React from "react";
import Image from "next/image";
import { ModeToggle } from "@/components/modle-toggle";
import { NavReports } from "./nav-reports";
import { NavUser } from "./nav-user";
import { NavGeneral } from "./nav-general";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarData } from "./useSidebarData";
import { useUserStore } from "@/stores/userStore";

export function AppSidebar() {
    const { open } = useSidebar();
    const user = useUserStore((state) => state.user);
    const { navReports, navGeneral } = useSidebarData(user);

    return (
        <Sidebar collapsible="icon" className="border-none">
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    {open ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center justify-start w-full">
                                <Image
                                    src="/logo.png"
                                    alt="EC-Infra-logo"
                                    width={100}
                                    height={32}
                                />
                            </div>
                            <div>
                                <ModeToggle />
                            </div>
                        </div>
                    ) : (
                        <Image
                            src="/logo2.png"
                            alt="EC-Infra-logo"
                            width={32}
                            height={32}
                        />
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavReports items={navReports} />
                <SidebarSeparator />
                <NavGeneral items={navGeneral} />
            </SidebarContent>

            <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
