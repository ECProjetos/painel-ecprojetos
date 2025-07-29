import { createClient } from "@/utils/supabase/server";

export async function getMacroprocessos(){
    const supabase = await createClient();

    const data = await supabase
    .from("macroprocesso")
    .select("*")

    return(data)
}

export async function getProcessos(){
    const supabase = await createClient();

    const data = await supabase
    .from("processo")
    .select("*")

    return(data)
}

