import '../../App.css'
import { useEffect, useState } from 'react'
// import { SavedUrl } from '../types';
import SavedTab from '../../components/SavedTab'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { getAllTabs, insertTab } from '../../services/supabaseService';
import { TabRow } from '../../services/supabaseService'
import { useAuthContext } from '../../context/AuthProvider';


function Homepage() {
  const [ userTabs, setUserTabs ] = useState<TabRow[]>([])
  const { session } = useAuthContext()

  useEffect(() => {
    fetchTabsFromDb();
  }, [])

  useEffect(() => {
    const checkAndPostLocalTabs = async () => {
      try {
        const tabs = await getLocalTabs()
        if (tabs.length > 0) {
          await postLocalTabsToDb(tabs)
        }
      } catch (error) {
        console.error(error)
      }
    }
    checkAndPostLocalTabs()
  }, [])


  const fetchTabsFromDb = async () => {
    const data = await getAllTabs();
    if (data) {
      setUserTabs([...data]);
    }
  }

  // const checkForLocalTabs = async () => {
  //   const tabs = await getLocalTabs(); 
  //   if (tabs.length > 0) {
  //     console.log('checkForLocalTabs: local tabs: ', tabs)
  //     setLocalTabs(true)
  //     return tabs
  //   } else {
  //     console.log('checkForLocalTabs: no tabs');
  //     return null
  //   }
  // }

  const postLocalTabsToDb = async (tabs: chrome.tabs.Tab[]) => {
    try {
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
    await fetchTabsFromDb();
  };


  function getLocalTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get("tabsData", (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching tabs data:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (result.tabsData) {
          console.log("Fetched tabs data:", result.tabsData);
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
    // const modifiedTab = await modifyTabData(tab)
    const returnedTab = await insertTab(await modifyTabData(tab))

    if (returnedTab) {
      // run function to append new tab to user tabs
      await updateUserTabs(returnedTab)
    }
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab) => {
    // const parsed = await shortenUrl(`${tabData.url}`);

    const newTab = {
      user_id: `${session?.user.id}`,
      url: `${tabData.url}`,
      parsed_url: await shortenUrl(`${tabData.url}`),
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

  const updateUserTabs = async (newTab: TabRow) => {
    setUserTabs(prevUserTabs => [...prevUserTabs, newTab])
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
          {userTabs.map((item: TabRow) => {
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
