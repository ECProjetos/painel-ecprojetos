'use server';

import { createClient } from '@/utils/supabase/server';


export async function getAtividades(){
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('activities')
        .select('*');

    if (error) {
        throw error;
    }

    return data;
}