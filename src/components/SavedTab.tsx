// import { SavedUrl } from '../pages/types'
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { ListItemButton } from '@mui/material';
import { TabRow } from '../services/bookmarksService';


const SavedTab = ({ link }: { link:TabRow }) => {

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
                        alt={link.description || undefined}
                        src={link.favicon_url || undefined}
                    />
                </ListItemAvatar>
                <ListItemText 
                    primary={link.description}
                    secondary={link.parsed_url}
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