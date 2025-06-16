// app/user-provider.tsx (server component)
import { getUserSession } from "@/app/(auth)/actions";
import ClientUserProvider from "./client-user-provider";

export default async function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();

  return (
    <ClientUserProvider user={session?.user ?? null}>
      {children}
    </ClientUserProvider>
  );
}
