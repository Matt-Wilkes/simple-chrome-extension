import '../../App.css'
import { useEffect, useState } from 'react'
// import { SavedUrl } from '../types';
import SavedTab from '../../components/SavedTab'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { getAllTabs, insertTab } from '../../services/bookmarksService';
import { TabRow } from '../../services/bookmarksService'
import { useAuthContext } from '../../context/AuthProvider';


function Homepage() {
  // const [savedLinks, setSavedLinks] = useState<TabRow[]>([])
  const [savedTabs, setSavedTabs] = useState<TabRow[]>([])
  const { session } = useAuthContext()

  // const MyComponent = (props: Props) => { ... }
  const fetchTabs = async () => {
    const data = await getAllTabs();
    if (data) {
      setSavedTabs(data)
    }
  }

  useEffect(() => {
    fetchTabs();
  }, [])

    // React to changes in the savedLinks array
  // useEffect(() => {
  //   console.log('saved link after update', savedTabs);
  //   // fetchTabs();
  // }, [savedTabs])

  // useEffect(() => {
  //   //listener to receive messages from the service worker
  //   const handleMessage = (receivedMessage: { message: string; data: chrome.tabs.Tab }) => {
  //     if (receivedMessage?.message === "Tab Info") {
  //       console.log("Received tab info:", receivedMessage.data);
  //       updateSavedLinks(modifyTabData(receivedMessage.data));
  //     }
  //   };

  //     // Attach the listener for runtime messages
  //   chrome.runtime.onMessage.addListener(handleMessage);

  //   // Clean up the listener on component unmount
  //   // return () => chrome.runtime.onMessage.removeListener(handleMessage);
  // }, []);



  async function shortenUrl(url: string): Promise<string> {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host;

    } catch (error) {
      return url;
    }
  }


  async function handleClick() {
    let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // updateSavedLinks(modifyTabData(activeTab))
    const modifiedTab = await modifyTabData(activeTab)
    const returnedTab = await insertTab(modifiedTab)
    
    if (returnedTab) {
      updateSavedTabs(returnedTab)
    }
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab) => {
    const parsed = await shortenUrl(`${tabData.url}`);

    const newTab = {
      user_id: `${session?.user.id}`,
      url: `${tabData.url}`,
      parsed_url: parsed,
      description: `${tabData.title}`,
      favicon_url: `${tabData.favIconUrl}`
    }
    return newTab
  }

  const updateSavedTabs = async (newTab: TabRow) => {
    setSavedTabs(prevSavedTabs => [...prevSavedTabs, newTab])
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
          {savedTabs.map((item: TabRow) => {
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

export default Homepage
