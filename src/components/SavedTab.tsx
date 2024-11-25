import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ListItemButton } from '@mui/material';
import { SavedTabProps } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities"




const SavedTab = ({ tab, handleDelete }: SavedTabProps) => {

    const {
        description,
        favicon_url,
        id,
        parsed_url,
        // position,
        url,
    } = tab

    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id})
    const style = {transition, transform: CSS.Transform.toString(transform)};
    
    const openNewTab = async (tabUrl: string, event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        await chrome.tabs.create(
            { url: tabUrl }
        )
        handleDelete(id)
        console.log(`${id} tab clicked`)
    }

    // const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    //     event.stopPropagation();
    //     console.log(`${id} delete clicked`)
    //     handleDelete(id);
    //   };
    

    return (
        <>
            <ListItem ref={setNodeRef} style={style}
                secondaryAction={
                    <IconButton data-no-dnd="true" onClick={() => handleDelete(id)} edge="end" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
                }
            >

                <ListItemButton data-no-dnd="true" 
                    onClick={(e) => openNewTab(`${url}`, e)}
                >
                    <ListItemAvatar>
                        <Avatar
                            alt={description || undefined}
                            src={favicon_url || undefined}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        primary={description}
                        secondary={parsed_url}
                    />
                </ListItemButton>

                <IconButton {...attributes} {...listeners} edge="end" aria-label="reorder">
                    <DragHandleIcon />
                </IconButton>
            </ListItem>
        </>


    )
}

export default SavedTab 