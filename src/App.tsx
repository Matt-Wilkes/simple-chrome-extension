import './App.css'
import { useEffect, useState } from 'react'
import { SavedUrl } from './pages/types';
import SavedTab from './components/SavedTab';
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';

function App() {
  // this is being stored inside the popup
  const [savedLinks, setSavedLinks] = useState<SavedUrl[]>([])

    // React to changes in the savedLinks array
    useEffect(() => {
      console.log('saved links', savedLinks)
    }, [savedLinks])
  
    useEffect(() => {
      //listener to receive messages from the service worker
      const handleMessage = (receivedMessage: { message: string; data: chrome.tabs.Tab }) => {
        if (receivedMessage?.message === "Tab Info") {
          console.log("Received tab info:", receivedMessage.data);
          updateSavedLinks(modifyTabData(receivedMessage.data));
        }
      };
  
      // Attach the listener for runtime messages
      chrome.runtime.onMessage.addListener(handleMessage);
  
      // Clean up the listener on component unmount
      // return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

  function shortenUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host;

    } catch (error) {
      console.error("Invalid Url", error);
      return url;
    }
  }

  async function handleClick() {
    let [activeTab] = await chrome.tabs.query({ active: true });
    updateSavedLinks(modifyTabData(activeTab))
  }

  const modifyTabData = (tabData: chrome.tabs.Tab) => {

    let parsed = shortenUrl(`${tabData.url}`);

    const newTab = {
      url: `${tabData.url}`,
      parsedUrl: parsed,
      description: `${tabData.title}`,
      favicon: `${tabData.favIconUrl}`
    }

    return newTab
  }

  const updateSavedLinks = async (modifiedTab: SavedUrl) => {
    setSavedLinks(prevSavedLinks => [...prevSavedLinks, modifiedTab])
  }


  return (
    <>
      <h1>Up Next</h1>
      <div className="card">
        <button onClick={() => handleClick()}>
          Add to up next
        </button>
      </div>
      <Box sx={{ flexGrow: 1, maxWidth: '100%' }}>
        {/* <Grid container spacing={5}> */}
        {/* <Grid size={{xs:12, md:6}}> */}
        <List
        >
          {savedLinks.map((item: SavedUrl) => {
            return (
              <SavedTab link={item} />
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
