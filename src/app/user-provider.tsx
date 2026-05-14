import { getUserSession } from "@/app/(auth)/actions"
import ClientUserProvider from "./client-user-provider"
import type { User } from "@supabase/supabase-js"

export default async function UserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  let user: User | null = null

  try {
    const session = await getUserSession()
    user = session?.user ?? null
  } catch (error) {
    console.error("Falha ao carregar sessão no UserProvider:", error)
    user = null
  }

  return <ClientUserProvider user={user}>{children}</ClientUserProvider>
}