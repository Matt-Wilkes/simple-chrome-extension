import { supabase } from "./supabaseClient";
import { Database } from "../index";

export type TabRow = Database["public"]["Tables"]["tabs"]["Row"];
export type TabInsert = Database["public"]["Tables"]["tabs"]["Insert"];

export const getAllTabs = async (): Promise<TabRow[] | null> => {
    const { data, error } = await supabase.from("tabs").select("*");
    if (error) {
        console.error("Error fetching Tabs:", error);
        return null;
    }
    return data;
};

export const insertTab = async (tab: TabInsert): Promise<TabRow | null> => {
    const { data, error } = await supabase.from("tabs").insert(tab).select()
        .single();

    if (error) {
        console.error(
            "Error inserting tab:",
            error.message,
            error.details,
            error.hint,
            error.name,
        );
        console.error("error data: ", data);
        return null;
    }
    console.log("inserting data:", data);
    return data;
};

export const deleteTabById = async (id: number) => {
    const { error } = await supabase.from("tabs").delete().eq("id", id)
    if (error) {
        console.error(
            "Error deleting tab:",
            error.message,
            error.details,
            error.hint,
            error.name,
        );
        console.error("error data: ");
        return null;
    }
    console.log("deleting tab id:", id);
};
