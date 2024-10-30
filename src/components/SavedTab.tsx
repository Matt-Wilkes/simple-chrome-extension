import { SavedUrl } from '../pages/types'
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ListItemButton } from '@mui/material';


const SavedTab = ({ link }: { link: SavedUrl }) => {

    const openNewTab = async (tabUrl: string) => {
        chrome.tabs.create(
            {url: tabUrl}
            )
    }

    return (
        <>
            <ListItem
                secondaryAction={
                    <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
                }
            >
                
                <ListItemButton
                onClick={() => openNewTab(`${link.url}`)}
                >
                <ListItemAvatar>
                    <Avatar
                        alt={link.description}
                        src={link.favicon}
                    />
                </ListItemAvatar>
                <ListItemText 
                    primary={link.description}
                    secondary={link.parsedUrl}
                />
                </ListItemButton>
                
                <IconButton edge="end" aria-label="delete">
                    <DragHandleIcon />
                </IconButton>
            </ListItem>
        </>


    )
}

export default SavedTab 