import { supabase } from "./supabaseClient"
import { Database } from "../index";
// import { QueryData } from "@supabase/supabase-js";
// import { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'

export type TabRow = Database["public"]["Tables"]["tabs"]["Row"];
export type TabInsert = Database["public"]["Tables"]["tabs"]["Insert"];
export type TabUpdate = Database["public"]["Tables"]["tabs"]["Update"];
export type TabGroupRow = Database["public"]["Tables"]["tab_group"]["Row"];
export type TabGroupInsert = Database["public"]["Tables"]["tab_group"]["Insert"];
export type TabGroupDefaultInsert = Omit<TabGroupRow, 'id'>;
export type TabRowLatestPosition = Pick<TabRow, 'position'>

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

export const insertTabGroup = async (tabGroup: TabGroupInsert): Promise<TabGroupRow> => {
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
        throw new Error("Tab group couldn't be inserted")
        // return
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

export const getAllTabsSortedByPos = async (): Promise<TabRow[] | null> => {
    const { data, error } = await supabase
    .from("tabs")
    .select("*")
    .order("position", {ascending: true});
    if (error) {
        console.error("Error fetching Tabs:", error);
        return null;
    }
    return data;
};

export const getLatestTabPosition = async (): Promise<TabRowLatestPosition | null> => {
    const { data, error } = await supabase
    .from("tabs")
    .select("position, tab_group (id,is_default)")
    .eq("tab_group.is_default",true)
    .order('position', {ascending: false})
    .limit(1)
    .single()
    
    if (error) {
        console.error("Error fetching Tabs:", error);
        throw error
    }
    return data
}

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

export const updateTabPosition = async (tab: TabInsert): Promise<TabUpdate | null> => {
    const { data, error } = await supabase.from("tabs").insert(tab).select()
        .single();

    if (error) {
        console.error(
            "Error updating tab:",
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

// Update: {
//     description?: string | null;
//     favicon_url?: string | null;
//     id?: number;
//     inserted_at?: string;
//     parsed_url?: string | null;
//     position?: number;
//     tab_group_id?: number | null;
//     updated_at?: string;
//     url?: string;
//     user_id?: string;
// }

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
