import './App.css'
import { useEffect, useState } from 'react'
import { SavedUrl } from './pages/types';
import SavedTab from './components/SavedTab';
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';

function App() {
// this is being stored inside the popup
// const [savedTab, setSavedTab] = useState<SavedUrl>({
//   url: "https://reactnative.dev/docs/turbo-native-modules-introduction",
//   parsedUrl: "reactnative.dev",
//   description: "Learn react native",
//   favicon: "https://reactnative.dev/img/favicon.ico"
// });
 const [savedLinks, setSavedLinks] = useState<SavedUrl[]>([])

 function shortenUrl(url:string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.host;
    
  } catch (error) {
    console.error("Invalid Url", error);
    return url;
  }
 }


  useEffect(() => {
    // console.log('saved tab', savedTab)
    console.log('saved links', savedLinks)
  }, [savedLinks])

  const onClick = async () => {
    // this is happening inside the page
    let [tab] = await chrome.tabs.query({ active: true });
    let parsed = shortenUrl(`${tab.url}`);

    const newTab = {
      url: `${tab.url}`,
      parsedUrl: parsed,
      description: `${tab.title}`,
      favicon: `${tab.favIconUrl}`
    }
    
    setSavedLinks(prevSavedLinks => [...prevSavedLinks, newTab])
  }


  return (
    <>
      <h1>Up Next</h1>
      <div className="card">
        <button onClick={() => onClick()}>
          Add to up next
        </button>
      </div>
      <Box sx={{ flexGrow: 1, maxWidth: '100%' }}>
      {/* <Grid container spacing={5}> */}
        {/* <Grid size={{xs:12, md:6}}> */}
            <List 
            >
              { savedLinks.map((item: SavedUrl) => {
                return (
                  <SavedTab link={item}/>
              );
            })
            }
            </List>
        {/* </Grid> */}
      {/* </Grid> */}
    </Box>
    </>
  )
}

export default App
