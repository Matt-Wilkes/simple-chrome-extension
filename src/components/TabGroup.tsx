import { Box } from "@mui/material";
import { TabGroupProps } from "../types";
import SavedTab from "./SavedTab";
import { deleteTabById, TabRow } from "../services/supabaseService";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function TabGroup({ tabGroup, userTabs, setUserTabs }: TabGroupProps) {

    const handleDelete = async (id: number) => {
        try {
          await deleteTabById(id);
          setUserTabs((prevUserTabs) => prevUserTabs.filter((tab) => tab.id !== id));
          console.log(`Tab with ID ${id} deleted successfully.`);
        } catch (error) {
          console.error("Error deleting tab:", error);
        }
      };

      const tabsInGroup = userTabs.filter((tab) => tab.tab_group_id === tabGroup.id);

    return (
            <Box >
                {tabGroup.name}
                <SortableContext items={tabsInGroup} strategy={verticalListSortingStrategy}>
                    {/* equivalent of 'tasks' in tutorial */}
                {tabsInGroup.map((tab: TabRow) => {
                    return (
                        <SavedTab key={tab.id} tab={tab} handleDelete={handleDelete}/>
                    );
                })
                }
                </SortableContext>

            </Box>

    )
}