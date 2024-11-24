import '../../App.css'
import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { getAllTabGroups, getAllTabs, insertTab, TabRow, TabGroupRow, getDefaultTabGroup } from '../../services/supabaseService';
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
    // console.log("default Tab Group", userDefaultTabGroup);
  }, [userTabGroups]);

  

  useEffect(() => {
    // Listen for messages from the service worker
    chrome.runtime.onMessage.addListener( (message, _sender, sendResponse) => {
      if (message.message === "tab_data") {
        console.log("Received tab data:", message.data);
        const tab = message.data;
        // console.log('default Tab Group = ',userDefaultTabGroup.current)
        console.log(`Tab Title: ${tab.title}, Tab URL: ${tab.url}`);
        // console.log('in useEffect, userTabGroups has data: ', userTabGroupsRef.current)
        // Send a response back to the service worker
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
   
    console.log("Default tab group ID:", userDefaultTabGroup);
    console.log('modifying tab ', tab)
    const modifiedTab = await modifyTabData(tab) // this seems to happen, fails during this process
    console.log('tab modified, about to insert tab: ', modifiedTab)
    const returnedTab = await insertTab(modifiedTab)
    console.log('tab inserted: ', modifiedTab)

    if (returnedTab) {
      // run function to append new tab to user tabs
      console.log('getCurrentTab updating user Tab:', returnedTab)
      await updateUserTabs(returnedTab)
    }
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab) => {
    const parsed = await shortenUrl(`${tabData.url}`);
    // const tab_group = await getOrCreateDefaultTabGroup()
    console.log('modify tab, current default tab group: ',userDefaultTabGroup.current)
    


    const newTab = {
      user_id: `${session?.user.id}`,
      url: `${tabData.url}`,
      parsed_url: parsed,
      description: `${tabData.title}`,
      favicon_url: `${tabData.favIconUrl}`,
      tab_group_id: userDefaultTabGroup.current
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

  // async function getOrCreateDefaultTabGroup(): Promise<number> {
  //   try {
  //     if (userTabGroups.length > 0) {
  //       const defaultTabGroup = userTabGroups.find((tabGroup) => tabGroup.is_default); // is this returning 'true' or truthy
  //       console.log('default tab group is :', defaultTabGroup)
  //       if (defaultTabGroup) {
  //         return defaultTabGroup.id; // Return the existing default tab group ID
  //       } else {
  //         console.log("no default tab group found")
  //         return 5
  //         throw new Error("no default tab group found!");
  //       }

  //     }
  //     // // Create a default tab group if it doesn't exist
  //     // const newTabGroup = await createDefaultTabGroup();
  //     // if (newTabGroup) {
  //     //   return newTabGroup.id!;
  //     // }
  //     // throw new Error("default group creation failed");
  //   } catch (error) {
  //     console.error("Error getting or creating default tab group:", error);
  //     throw new Error("Error getting or creating default tab group");
  //   }
  //   console.log('returning 6')
  //    return 6// fallback
  // }

  // async function createDefaultTabGroup(): Promise<TabGroupInsert> {
  //   const defaultTabGroup = {
  //       is_default: true,
  //       user_id: `${session?.user.id}`,
  //       name: 'Default'
  //   }
  //   console.log(defaultTabGroup);
  //   const insertedTabGroup = await insertTabGroup(defaultTabGroup);
  //   if (insertedTabGroup) {
  //     return insertedTabGroup
  //   } else {
  //     throw new Error("Error creating default tab group")
  //   }
  // }

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
