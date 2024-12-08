import { Box, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import { TabGroupProps } from "../types";
import SavedTab from "./SavedTab";
import { TabRow } from "../services/supabaseService";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
// import { useMemo } from "react";
import { CSS } from "@dnd-kit/utilities"
import { purple } from "@mui/material/colors";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';

export function TabGroup({ tabGroup, userTabs, userTabsIds, handleDelete, changeTabGroupName, updateDefaultTabGroup }: TabGroupProps) {

    const {
        id,
        name,
        is_default
    } = tabGroup

    const [tabGroupName, setTabGroupName] = useState<string>(name)
    const [editMode, setEditMode] = useState(false);
    const [isDefault, setIsDefault] = useState(is_default)


    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable(
        {
            id: id,
            data: {
                type: "tabGroup",
                tabGroup
            }
        })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // const changeTabGroupName = (id: number, name: string) => {
    //     updateTabGroup(id, {
    //         name: name
    //     })
    // }

    if (isDragging) {
        return (
            <Box component="div"
                ref={setNodeRef} //so dnd can handle the div
                style={style}
                sx={{ bgcolor: purple[200], }}
            >

            </Box>
        )
    }

    return (
        <Box
            ref={setNodeRef} //so dnd can handle the div
            style={style}
            sx={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '15px', gap: '8px' }} 
        >

            <Box
                {...attributes}
                {...listeners}
                sx={{ gap: '10px' }}
            >

                <Box sx={{ alignItems: 'center', minWidth: '45%', maxWidth: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '12px', backgroundColor: 'primary.light', borderRadius: '15px' }}
                // onBlur={() => {
                //                     setEditMode(false);
                //                 }}
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
                                        color: 'primary.dark',
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
                                sx={{ maxWidth: '200px', border: 'none' }}
                            />
                            <Box>
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
            </Box>
            <SortableContext
                items={userTabsIds}
                strategy={verticalListSortingStrategy}>
                {userTabs.map((tab: TabRow) => (
                    <SavedTab key={tab.id} tab={tab} tabGroupId={id} handleDelete={handleDelete} />
                ))
                }
            </SortableContext>

        </Box>

    )
}