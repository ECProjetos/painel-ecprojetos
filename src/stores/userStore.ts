import { create } from "zustand";
import { User } from "@supabase/supabase-js";

export interface UserStoreState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
}));
