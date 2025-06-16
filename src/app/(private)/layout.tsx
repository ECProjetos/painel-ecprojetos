import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Aqui entram os filhos: layouts e páginas aninhadas */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
