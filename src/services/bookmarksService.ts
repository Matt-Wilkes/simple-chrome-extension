import { supabase } from "./supabaseClient";
import {Database} from '../index'

export type TabRow = Database['public']['Tables']['tabs']['Row']
export type TabInsert = Database['public']['Tables']['tabs']['Insert']

// Just here so I can see properties for now
// tab: {
//     description?: string | null;
//     favicon_url?: string | null;
//     id?: number;
//     inserted_at?: string;
//     parsed_url?: string | null;
//     position?: number | null;
//     tab_group_id?: number | null;
//     updated_at?: string;
//     url: string;
//     user_id: string;
// }

export const getAllTabs = async (): Promise<TabRow[] | null> => {
    const  { data, error } = await supabase.from('tabs').select('*');
    if (error) {
        console.error('Error fetching Tabs:', error);
        return null;
    }
    return data;
}



export const insertTab = async (tab: TabInsert): Promise<TabRow | null> => {
    const { data, error } = await  supabase.from('tabs').insert(tab).select().single();

    if (error) {
        console.error('Error inserting tab:', error.message, error.details, error.hint, error.name);
        console.error('error data: ', data)
        return null
    }
    console.log('inserting data:', data)
    return data;
    
};