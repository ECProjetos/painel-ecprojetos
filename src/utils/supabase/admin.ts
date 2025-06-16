import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
}

)

export { supabaseAdmin }

