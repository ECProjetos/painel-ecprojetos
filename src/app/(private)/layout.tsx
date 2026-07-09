import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { isRhFeriasAdmin } from "@/app/actions/ferias"

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/login")
  }

  const temAcessoFerias = await isRhFeriasAdmin()

  return (
    <SidebarProvider>
      <AppSidebar temAcessoFerias={temAcessoFerias} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}