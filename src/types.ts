import { TabGroupRow, TabRow } from "./services/supabaseService";


// export type SavedUrl = {
//     url: string;
//     parsedUrl: string;
//     description: string;
//     favicon: string;
// };

export type SavedTabProps = {
    tab:TabRow; 
    handleDelete: (id: number) => void;
}

export type TabGroupProps = {
    tabGroup: TabGroupRow;
    userTabs: TabRow[];
    handleDelete: (id: number) => void; 
}

