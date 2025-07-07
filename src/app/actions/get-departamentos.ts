"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAllDepartments() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("departments")
            .select("*")
            .order("name", { ascending: true });
        if (error) {
            throw new Error(`Error fetching departments: ${error.message}`);
        }
        // Return the fetched departments like array of dictionaries [id: value, nome: value]
        return data

    }

    catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}
// This function fetches all departments from the 'departments' table in the Supabase database.
// It returns an array of objects, each containing the id and nome of the cargo.