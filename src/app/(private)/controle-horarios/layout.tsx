// app/(private)/controle-horarios/inicio/layout.tsx
"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TimesheetSidebar } from "@/components/sidebar/timesheet-sidebar";

export default function ControleHorariosInicioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Segundo provedor: isola o estado do TimesheetSidebar
    <SidebarProvider>
      <TimesheetSidebar />

      <main>{children}</main>
    </SidebarProvider>
  );
}
