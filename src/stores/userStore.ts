import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

// Enhanced user type with role information
export interface EnhancedUser extends User {
  name?: string;
  role?: string;
}

interface UserStore {
  user: EnhancedUser | null;
  setUser: (user: EnhancedUser) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
