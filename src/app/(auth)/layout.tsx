import { redirect } from "next/navigation"
import { getUserSession } from "./actions"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let shouldRedirect = false

  try {
    const response = await getUserSession()

    if (response?.user) {
      shouldRedirect = true
    }
  } catch (error) {
    console.error("Falha ao verificar sessão no AuthLayout:", error)
  }

  if (shouldRedirect) {
    redirect("/controle-horarios/inicio")
  }

  return <>{children}</>
}