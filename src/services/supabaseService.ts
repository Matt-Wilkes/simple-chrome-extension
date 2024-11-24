import { supabase } from "./supabaseClient"
import { Database } from "../index";

export type TabRow = Database["public"]["Tables"]["tabs"]["Row"];
export type TabInsert = Database["public"]["Tables"]["tabs"]["Insert"];
export type TabGroupRow = Database["public"]["Tables"]["tab_group"]["Row"];
export type TabGroupInsert = Database["public"]["Tables"]["tab_group"]["Insert"];
export type TabGroupDefaultInsert = Omit<TabGroupRow, 'id'>;

export const getAllTabGroups = async (): Promise<TabGroupRow[]> => {
    const { data, error } = await supabase.from("tab_group").select("*");
    if (error) {
        console.error("Error fetching Tab Groups:", error);
        return [];
    }
    return data;
};

export const getDefaultTabGroup = async (): Promise<TabGroupRow | null> => {
    const { data, error } = await supabase.from("tab_group").select("*").eq("is_default",true).single();
    if (error) {
        console.error("Error fetching Tab Groups:", error);
        return null;
    }
    return data;
};

export const insertTabGroup = async (tabGroup: TabGroupInsert): Promise<TabGroupRow | null> => {
    const { data, error } = await supabase.from("tab_group").insert(tabGroup).select().single();

    if (error) {
        console.error(
            "Error inserting tab group:",
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
