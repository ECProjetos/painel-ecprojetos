"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAllCargos() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("cargos")
            .select("*")
            .order("nome", { ascending: true });
        if (error) {
            throw new Error(`Error fetching cargos: ${error.message}`);
        }

        // Return the fetched cargos like array of dictionaries [id: value, nome: value]
        return data.map(cargo => ({
            id: cargo.id,
            nome: cargo.nome
        }));

    }

    catch (error) {
        console.error("Error fetching cargos:", error);
        return [];
    }
}
// This function fetches all cargos from the 'cargos' table in the Supabase database.
// It returns an array of objects, each containing the id and nome of the cargo.