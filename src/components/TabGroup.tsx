import { Box } from "@mui/material";
import { TabGroupProps } from "../types";
import SavedTab from "./SavedTab";
import { TabRow } from "../services/supabaseService";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
// import { useMemo } from "react";
import { CSS } from "@dnd-kit/utilities"

export function TabGroup({ tabGroup, userTabs, userTabsIds, handleDelete }: TabGroupProps) {

    const {
        id,
    } = tabGroup

    // const userTabsIds = useMemo(() => userTabs.map((tab) => tab.id), [userTabs])
    
    const {setNodeRef, attributes, listeners,  transform, transition, isDragging} = useSortable(
        {id: id, 
            data: {
                type: "tabGroup", 
                tabGroup
            }
        })

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

    if (isDragging) {
        return (
            <Box component="div"
            ref={setNodeRef} //so dnd can handle the div
            style={style}
            sx={{bgcolor: 'black',}}
            >
                
            </Box>
        )
    }

    return (
            <Box component="div"
            ref={setNodeRef} //so dnd can handle the div
            style={style}
            // sx={{bgcolor: 'pink',}}
            >
                
                <Box 
                {...attributes}
                {...listeners}
                >
                {tabGroup.name}
                <SortableContext 
                items={userTabsIds} 
                strategy={verticalListSortingStrategy}>
                    {/* equivalent of 'tasks' in tutorial */}
                {userTabs.map((tab: TabRow) => (
                    <SavedTab key={tab.id} tab={tab} tabGroupId={id} handleDelete={handleDelete}/>
                    ))
                }
                </SortableContext>
                </Box>
                

            </Box>

    )
}