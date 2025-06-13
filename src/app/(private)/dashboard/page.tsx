"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/stores/userStore";

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4 pl-0 dark:bg-[#18181B]">
          <div className="bg-white shadow-lg rounded-2xl p-6 w-full min-h-full border dark:bg-[#1c1c20]">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex flex-col items-center justify-center">
              <h1>Dashboard</h1>
              <p>This is the dashboard page.</p>
              <p>Only authenticated users can see this page.</p>
              <p>
                User:{" "}
                <strong>
                  {user?.user_metadata?.full_name }
                </strong>
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
