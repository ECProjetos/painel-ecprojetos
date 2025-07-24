'use server';

import { createClient } from '@/utils/supabase/server';


export async function getProjetos(){
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*');

    if (error) {
        throw error;
    }

    return data;
}