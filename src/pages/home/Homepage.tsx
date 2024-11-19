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
  const [savedTabs, setSavedTabs] = useState<TabRow[]>([])
  // const [localTabsUpdated, setlocalTabsUpdated] = useState(false)
  const { session } = useAuthContext()

  useEffect(() => {
    postLocalTabsToDb()
    fetchTabsFromDb();
  }, [])

  const fetchTabsFromDb = async () => {
    const data = await getAllTabs();
    if (data) {
      setSavedTabs(data)
    }
  }


  const postLocalTabsToDb = async () => {
    try {
      const tabs = await getLocalTabs(); 
      await Promise.all(
        tabs.map((tab) => handleNewTab(tab))
      );
      console.log("All tabs posted to database. Clearing local storage...");
      chrome.storage.local.clear(() => {
        console.log("Local storage cleared.");
      });

    } catch (error) {
      console.error("Error posting tabs to database:", error);
    }
  };


  function getLocalTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get("tabsData", (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching tabs data:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (result.tabsData) {
          console.log("Fetched tabs data:", result.tabsData);
          // setlocalTabsUpdated(true)
          resolve(result.tabsData);
        } else {
          console.log("No tabs data found.");
          resolve([]);
        }
      });
    });
  }

  async function getCurrentTab() {
    let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return activeTab
  }

  async function handleNewTab(tab: chrome.tabs.Tab) {
    const modifiedTab = await modifyTabData(tab)
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

  async function shortenUrl(url: string): Promise<string> {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host;

    } catch (error) {
      return url;
    }
  }

  const updateSavedTabs = async (newTab: TabRow) => {
    setSavedTabs(prevSavedTabs => [...prevSavedTabs, newTab])
  }


  return (
    <>
      <h1>Up Next</h1>
      <div className="card">
        <button onClick={async () => handleNewTab(await getCurrentTab())}>
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
