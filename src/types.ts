import { TabGroupRow, TabRow } from "./services/supabaseService";

export type SavedTabProps = {
    tab:TabRow; 
    handleDelete: (id: number) => void;
}

export type TabGroupProps = {
    tabGroup: TabGroupRow;
    userTabs: TabRow[];
    handleDelete: (id: number) => void; 
}

export type NewTab = Omit<TabRow,'id' | 'inserted_at' | 'updated_at'>
