import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ListItemButton } from '@mui/material';
import { SavedTabProps } from '../types';


const SavedTab = ({ tab, onDelete }: SavedTabProps) => {

    const openNewTab = async (tabUrl: string) => {
        try {
            await chrome.tabs.create({ url: tabUrl })
            onDelete(id)
        } catch (error) {
            console.log("error following tab click:", error)
        }
        
    }

    const {
        description,
        favicon_url,
        id,
        // inserted_at,
        parsed_url,
        // position,
        // tab_group_id,
        // updated_at,
        url,
        // user_id
    } = tab

    return (
        <>
            <ListItem
                secondaryAction={
                    <IconButton onClick={() => onDelete(id)} edge="end" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
                }
            >

                <ListItemButton
                    onClick={() => openNewTab(`${url}`)}
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

                <IconButton edge="end" aria-label="reorder">
                    <DragHandleIcon />
                </IconButton>
            </ListItem>
        </>


    )
}

export default SavedTab 