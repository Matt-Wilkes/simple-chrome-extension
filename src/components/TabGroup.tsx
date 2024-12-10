import { Box, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import { TabGroupProps } from "../types";
import SavedTab from "./SavedTab";
import { TabRow } from "../services/supabaseService";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
// import { useMemo } from "react";
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import theme from "./createTheme";

export function TabGroup({ tabGroup, userTabs, userTabsIds, handleDelete, changeTabGroupName, updateDefaultTabGroup }: TabGroupProps) {

    const {
        id,
        name,
        is_default
    } = tabGroup

    const [tabGroupName, setTabGroupName] = useState<string>(name)
    const [editMode, setEditMode] = useState(false);
    const [isDefault, setIsDefault] = useState(is_default)


    const { setNodeRef, attributes, listeners, transform, transition } = useSortable(
        {
            id: id,
            data: {
                type: "tabGroup",
                tabGroup
            },
            disabled: editMode,
        })


    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };


    // if (isDragging) { //there is an issue here
    //     // placeholder element in the original position of the dragged item
    //     //BUG: this is taking on the height of the container being hovered over
        
    //     return (
    //         <>
    //         <Box
    //         ref={setNodeRef} //so dnd can handle the div
    //         style={style} 
    //         sx={{ 
    //             display: 'flex', 
    //             flexDirection: 'column', 
    //             minHeight: '100px',
    //             maxHeight: '300px',
    //             maxWidth: '360px', 
    //             borderRadius: '15px', 
    //             border: "2px solid",
    //             gap: '8px' ,
    //             borderColor: theme.palette.primary.light,
    //         }} 
    //         />
    //         <Typography>{id}</Typography>
    //         <Typography>{isDragging}</Typography>
    //         </>
            
    //     )
        
    // }

    return (
        // default rendering logic 
        <Box
            {...attributes}
            {...listeners}
            ref={setNodeRef} //so dnd can handle the div
            style={style} 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '100px',
                maxWidth: '360px', 
                borderRadius: '15px', 
                // border: "2px solid",
                gap: '8px' ,
                // borderColor: theme.palette.primary.light,
            }} 
        >

            {/* <Box
                {...attributes}
                {...listeners}
                sx={{ gap: '10px' }}
            > */}
                {/* column header row */}
                <Box 
                sx={{ alignItems: 'center', maxWidth: '320px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '12px', backgroundColor: theme.palette.primary.light, borderRadius: '15px' }}
                
                >
                    {!editMode && (
                        <>
                            <Typography
                                color="primary.contrastText"
                            >
                                {tabGroupName}
                            </Typography>

                            <EditIcon
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        color: theme.palette.primary.dark,
                                    },
                                    '&:active': {
                                        backgroundColor: 'inherit',
                                    },
                                }}
                                onClick={() => setEditMode(true)}
                            />
                        </>
                    )}
                    {editMode && (
                        <>
                        <Box sx={{ maxWidth: '50%'}}>
                        <TextField
                                variant="standard"
                                margin="none"
                                label="Group name"
                                value={tabGroupName}
                                onChange={e => setTabGroupName(e.target.value)}
                                size="small"
                                autoFocus
                                // onBlur={() => {
                                //     setEditMode(false);
                                // }}
                                onKeyDown={e => {
                                    console.log(e.key)
                                    if (e.key === "Enter") {
                                        changeTabGroupName(id, tabGroupName)
                                        setEditMode(false)
                                    }
                                }}
                                sx={{ maxWidth: '100%', border: 'none' }}
                            />
                        </Box>
                            <Box sx={{ maxWidth: '50%' }}>
                            {isDefault && (

                                <FormControlLabel disabled control={
                                    <Switch 
                                    checked={isDefault}
                                    color="default"
                                    />
                                } label="Default" />
                            )} { !isDefault && (

                                <FormControlLabel control={<Switch 
                                    checked={isDefault}
                                    onChange={() => {
                                        setIsDefault(!isDefault)
                                        updateDefaultTabGroup(id)
                                    }}
                                    color="default"
                                    />} label="Default" />
                            )}
                            <EditIcon
                                onClick={() => {setEditMode(false)}}
                                sx={{
                                    color: 'primary',
                                    cursor: 'pointer', 
                                    '&:hover': {
                                        backgroundColor: 'inherit',
                                        color: 'primary.dark',
                                    },
                                    '&:active': {
                                        backgroundColor: 'inherit',
                                    },
                                }}
                            />
                            </Box>
                        </>
                    )}
                </Box>
            {/* </Box> */}
            
            <SortableContext
                items={userTabsIds}
                strategy={verticalListSortingStrategy}
                >
                {userTabs.map((tab: TabRow) => (
                    <SavedTab key={tab.id} tab={tab} tabGroupId={id} handleDelete={handleDelete} />
                ))
                }
            </SortableContext>
             
        </Box>

    )
}