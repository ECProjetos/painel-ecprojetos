// app/(private)/controle-horarios/inicio/layout.tsx
"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
      <SidebarInset className="w-full">
        <div className="flex flex-col justify-center min-h-screen bg-gray-50 p-2 sm:p-4 pl-0 dark:bg-[#18181B]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
