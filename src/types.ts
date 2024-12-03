import { TabGroupRow, TabRow } from "./services/supabaseService";

export type SavedTabProps = {
    tab:TabRow; 
    tabGroupId: number
    handleDelete: (id: number) => void;
}

export type TabGroupProps = {
    tabGroup: TabGroupRow;
    userTabs: TabRow[];
    userTabsIds: number[]
    handleDelete: (id: number) => void; 
}

export type NewTab = Omit<TabRow,'id' | 'inserted_at' | 'updated_at'>
export type UpdateTab = Omit<TabRow, 'id' | 'description'| 'favicon_url'| 'inserted_at' |'parsed_url' | 'updated_at' | 'url' |'user_id'>
