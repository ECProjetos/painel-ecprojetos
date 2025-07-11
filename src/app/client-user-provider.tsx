
// app/client-user-provider.tsx
"use client";

import { useUserStore } from "@/stores/userStore";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

export default function ClientUserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    console.log('ClientUserProvider received user:', user);
    if (user) {
      setUser(user);
      console.log('ClientUserProvider setting user in store:', user);
      if (user.user_metadata?.theme === "dark") {
        document.querySelector("html")?.classList.add("dark");
      } else {
        document.querySelector("html")?.classList.remove("dark");
      }
    } else {
      console.log('ClientUserProvider user is null, removing dark class.');
      document.querySelector("html")?.classList.remove("dark");
    }
  }, [user, setUser]);

  return <>{children}</>;
}
