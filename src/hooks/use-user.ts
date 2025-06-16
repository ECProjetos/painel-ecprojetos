'use server';

import { createClient } from '@/utils/supabase/server';


export async function getUser() {
  const supabase = await createClient();

  // Get authenticated user using getUser() instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Return null if no user is authenticated
  }

  // Get user profile with role information
  const { data: profile, error } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error('Error fetching user profile:', error);
    return null; // Return null if there's an error fetching the profile
  }
  return {
    ...user,
    role: profile?.role,
    name: profile?.name,
  };
}