import { getUserSession } from "@/app/(auth)/actions"
import { redirect } from "next/navigation"

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  try {
    const response = await getUserSession()

    if (response?.user) {
      redirect("/controle-horarios/inicio")
    }
  } catch (error) {
    console.error("Falha ao verificar sessão no AuthLayout:", error)
  }

  return <>{children}</>
}