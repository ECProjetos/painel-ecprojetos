
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useClientRole() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserRole() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user role:', error);
                } else {
                    setRole(data.role);
                }
            }
            setLoading(false);
        }

        fetchUserRole();
    }, []);

    return { role, loading };
}
