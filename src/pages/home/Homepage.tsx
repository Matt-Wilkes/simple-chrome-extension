import '../../App.css'
import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { getAllTabGroups, getAllTabs, insertTab, TabRow, TabGroupRow, getDefaultTabGroup, insertTabGroup } from '../../services/supabaseService';
import { useAuthContext } from '../../context/AuthProvider';
import { TabGroup } from '../../components/TabGroup';



function Homepage() {
  const [userTabs, setUserTabs] = useState<TabRow[]>([])
  const [userTabGroups, setUserTabGroups] = useState<TabGroupRow[]>([])
  const userDefaultTabGroup = useRef<number>(0)
  const { session } = useAuthContext()



  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTabsGroupsFromDb();
        await fetchTabsFromDb();
      } catch (error) {
        console.log('error fetching data', error)
      }
    }
    fetchData();
  }, [])

  useEffect(() => {
    const fetchDefaultTabGroup = async () => {
      try {
        const defaultTabGroup = await getDefaultTabGroup();
        if (defaultTabGroup) {
          console.log('default Tab Group = ',defaultTabGroup.id)
          userDefaultTabGroup.current = defaultTabGroup.id
        } else {
          console.log("No default group found")
        }
        
      } catch (error) {
        console.log("error fetching default tab group", error)
      }
    }
    fetchDefaultTabGroup();
  }, [userTabGroups]);

  

  useEffect(() => {
    // Listen for messages from the service worker
    chrome.runtime.onMessage.addListener( (message, _sender, sendResponse) => {
      if (message.message === "tab_data") {
        console.log("Received tab data:", message.data);
        const tab = message.data;
        console.log(`Tab Title: ${tab.title}, Tab URL: ${tab.url}`);
        console.log('Sending tab to DB...')
        
        handleNewTab(tab);
        sendResponse({ status: "success", data: "Tab processed successfully." });
        
      }
      // Returning true keeps the message channel open for async responses
      return true;
    });
  }, [])

  useEffect(() => {
    const checkAndPostLocalTabs = async () => {
      try {
        
        // chck for local tabs
        const tabs = await getLocalTabs()
        if (tabs.length > 0) {
          // post the local tabs to the DB
          console.log('local tabs = ', tabs)
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

  const fetchTabsGroupsFromDb = async () => {
    const data = await getAllTabGroups();
    if (data) {
      console.log("Fetched Tab Groups:", data);
      setUserTabGroups([...data]);
    }
    
  }


  const postLocalTabsToDb = async (tabs: chrome.tabs.Tab[]) => {
    try {
      // for each tab in local storage, create promise, send each one to DB
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
    await fetchTabsFromDb()
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
   
    const modifiedTab = await modifyTabData(tab) 
    const returnedTab = await insertTab(modifiedTab)
    console.log('tab inserted: ', modifiedTab)

    if (returnedTab) {
      console.log('getCurrentTab updating user Tab:', returnedTab)
      await updateUserTabs(returnedTab)
    }
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab) => {
    const parsed = await shortenUrl(`${tabData.url}`);
    const defaultTabGroup = await getOrCreateDefaultTabGroup()
    console.log('modify tab, current default tab group: ',userDefaultTabGroup.current)

    const newTab = {
      user_id: `${session?.user.id}`,
      url: `${tabData.url}`,
      parsed_url: parsed,
      description: `${tabData.title}`,
      favicon_url: `${tabData.favIconUrl}`,
      tab_group_id: defaultTabGroup
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

  const getOrCreateDefaultTabGroup = async (): Promise<number> => {
    try {
      if (userDefaultTabGroup.current) {
        return userDefaultTabGroup.current
      } else {
        const newDefaultTabGroup = await createDefaultTabGroup()
        if (newDefaultTabGroup) {
          console.log('newly created tab group id: ', newDefaultTabGroup.id)
          userDefaultTabGroup.current = newDefaultTabGroup.id
          await fetchTabsGroupsFromDb(); // update the state of tab groups, so tabs render correctly
          return newDefaultTabGroup.id
        }
      }
    } catch (error) {
      console.log("error getting default tab group", error)
      return null!
    }
    throw new Error("Error getting default tab group")
  }

  const createDefaultTabGroup = async (): Promise<TabGroupRow | null> => {
      try {
        const newDefaultTabGroup = await insertTabGroup({
          is_default: true,
          name: 'Default',
          user_id: `${session?.user.id}`
        })
        if (newDefaultTabGroup) {
          return newDefaultTabGroup
        } else {
          throw new Error("Error creating default tab group")
        }
      } catch (error) {
        console.log("Error creating default tab group",error)
        return null
      }
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
          {userTabGroups.map((tabGroup: TabGroupRow) => {
            return (
              <TabGroup key={tabGroup.id} tabGroup={tabGroup} userTabs={userTabs} setUserTabs={setUserTabs} />
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
