import { TabGroupRow, TabRow } from "./services/supabaseService";


// export type SavedUrl = {
//     url: string;
//     parsedUrl: string;
//     description: string;
//     favicon: string;
// };

export type SavedTabProps = {
    tab:TabRow; 
    onDelete: (id: number) => void;
}

export type TabGroupProps = {
    tabGroup: TabGroupRow;
    userTabs: TabRow[];
    setUserTabs: React.Dispatch<React.SetStateAction<TabRow[]>>;
}

