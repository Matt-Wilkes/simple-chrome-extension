import '../../App.css'
import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { getAllTabGroups, getAllTabs, insertTab, TabRow, TabGroupRow, getDefaultTabGroup, insertTabGroup } from '../../services/supabaseService';
import { useAuthContext } from '../../context/AuthProvider';
import { TabGroup } from '../../components/TabGroup';
import {closestCorners, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MouseSensor, TouchSensor } from '../../utils/dndCustomSensors';

function Homepage() {
  const [userTabs, setUserTabs] = useState<TabRow[]>([])
  const [userTabGroups, setUserTabGroups] = useState<TabGroupRow[]>([])
  const userDefaultTabGroup = useRef<number>(0)
  const { session } = useAuthContext()

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTabGroupsFromDb();
        await fetchTabsFromDb();
      } catch (error) {
        console.log('error fetching data', error)
      }
    }
    fetchData();
  }, [])

  useEffect(() => {
    getOrCreateDefaultTabGroup();
  }, [userTabGroups]);

  

  useEffect(() => {
    // Listen for messages from the service worker
    if (chrome?.runtime?.id) 
      {chrome.runtime.onMessage.addListener( (message, _sender, sendResponse) => {
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
    })} else {
      console.log("Not running in a chrome extension env")
    };
  }, [])

  useEffect(() => {
    const checkAndPostLocalTabs = async () => {
      try {
        const tabs = await getLocalTabs()
        if (userDefaultTabGroup.current === 0 && tabs.length > 0) {
          await fetchTabsFromDb()
          await postLocalTabsToDb(tabs)
        } else if (tabs.length > 0) {
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

  const fetchTabGroupsFromDb = async () => {
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
      if (chrome?.runtime?.id)
      {chrome.storage.local.get("tabsData", (result) => {
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
    } else {
      resolve([])
    }});
  }

  async function getCurrentTab() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || activeTab.id === undefined) {
        throw new Error("No active tab or tab ID found.");
      }
      await chrome.tabs.remove(activeTab.id);
      return activeTab;
    } catch (error) {
      console.error("Error in getCurrentTab:", error);
      throw error;
    }
  }

  async function handleNewTab(tab: chrome.tabs.Tab) {
    const modifiedTab = await modifyTabData(tab, userDefaultTabGroup.current) 
    const returnedTab = await insertTab(modifiedTab)
    console.log('tab inserted: ', modifiedTab)

    if (returnedTab) {
      console.log('getCurrentTab updating user Tab:', returnedTab)
      await updateUserTabs(returnedTab)
    }
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab, defaultTabGroup: number) => {
    const parsed = await shortenUrl(`${tabData.url}`);
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
      const defaultTabGroup = await getDefaultTabGroup();
      if (defaultTabGroup) {
        console.log('default Tab Group = ',defaultTabGroup.id)
        if (defaultTabGroup.id !== 0 )
        userDefaultTabGroup.current = defaultTabGroup.id
        return userDefaultTabGroup.current
      } else {
        const newDefaultTabGroup = await createDefaultTabGroup()
        if (newDefaultTabGroup) {
          console.log('newly created tab group id: ', newDefaultTabGroup.id)
          userDefaultTabGroup.current = newDefaultTabGroup.id
          await fetchTabGroupsFromDb(); // update the state of tab groups, so tabs render correctly
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

  const getTabPos = (id: number) => 
    userTabs.findIndex((userTab) => 
      userTab.id === id);

  const handleDragEnd = (event: { active: any; over: any; }) => {
    // active is the element we're currently dragging
    // over is the element that will be replaced once we let go of the active element
    const {active, over} = event
    // if the same position 
    if (active.id === over.id) return;

    setUserTabs(userTab => {
      // get the original position of the element BEFORE dragging
      const originalPos = getTabPos(active.id);
      // get the new position of where it should be after the array has updated
      const newPos = getTabPos(over.id)

      return arrayMove(userTab, originalPos, newPos)
    })
  } 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

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
        <List>
          {userTabGroups.map((tabGroup: TabGroupRow) => {
            return (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
                {/* this is my equivalent of tutorial column */}
              <TabGroup key={tabGroup.id} tabGroup={tabGroup} userTabs={userTabs} setUserTabs={setUserTabs} />
              </DndContext>
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
