'use server';

import { createClient } from '@/utils/supabase/server';


export async function getHours(){
    const supabase = await createClient()

    const data = await supabase.from('vw_user_month_balance').select('*')

    return data
}