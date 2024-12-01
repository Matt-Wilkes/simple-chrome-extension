import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
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
    // https://docs.dndkit.com/presets/sortable
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable(
        {id: id, 
            data: {
                type: "tab", 
                tab
            }
        })
    const style = {transition, transform: CSS.Transform.toString(transform)};
    
    const openNewTab = async (tabUrl: string, event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        await chrome.tabs.create(
            { url: tabUrl }
        )
        handleDelete(id)
        console.log(`${id} tab clicked`)
    }
    

    return (
        <>
            <ListItem 
            ref={setNodeRef} 
            style={style}
            {...attributes} {...listeners}
            >
                <ListItemButton
                data-no-dnd="true" 
                onClick={(e) => openNewTab(`${url}`, e)}
                >
                    <ListItemAvatar>
                        <Avatar
                            alt={description || undefined}
                            src={favicon_url || undefined}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        primary={`${description}`}
                        secondary={parsed_url}
                    />
                </ListItemButton>
                <IconButton data-no-dnd="true" onClick={() => handleDelete(id)} edge="end" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
            </ListItem>
        </>


    )
}

export default SavedTab 