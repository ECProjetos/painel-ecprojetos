import { getUserSession } from "@/app/(auth)/actions";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const response = await getUserSession();
  if (response?.user) {
    redirect("/controle-horarios/inicio");
  }
  return <>{children}</>;
}
