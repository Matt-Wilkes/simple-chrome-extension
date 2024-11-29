import '../../App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box';
import { getAllTabGroups, getAllTabs, insertTab, TabRow, TabGroupRow, getDefaultTabGroup, insertTabGroup, deleteTabById } from '../../services/supabaseService';
import { useAuthContext } from '../../context/AuthProvider';
import { TabGroup } from '../../components/TabGroup';
import {closestCorners, DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MouseSensor, TouchSensor } from '../../utils/dndCustomSensors';
import { createPortal } from 'react-dom';
import SavedTab from '../../components/SavedTab';

function Homepage() {
  const userDefaultTabGroup = useRef<number>(0)
  const { session } = useAuthContext();

  const [userTabs, setUserTabs] = useState<TabRow[]>([])
  
  const [ activeTab, setActiveTab ] = useState<TabRow | null>(null)
  const [userTabGroups, setUserTabGroups] = useState<TabGroupRow[]>([])
  const userTabGroupsId = useMemo(() => userTabGroups.map((tabGroup) => tabGroup.id), [userTabGroups])
  const [ activeTabGroup, setActiveTabGroup ] = useState<TabGroupRow | null>(null)

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
    await fetchTabsFromDb() // is this necessary? check each new tab is being written to state
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

  const handleDelete = async (id: number) => {
    try {
      await deleteTabById(id);
      setUserTabs((prevUserTabs) => prevUserTabs.filter((tab) => tab.id !== id));
      console.log(`Tab with ID ${id} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting tab:", error);
    }
  };

  const modifyTabData = async (tabData: chrome.tabs.Tab, defaultTabGroup: number) => {
    const parsed = await shortenUrl(`${tabData.url}`);
    console.log('modify tab, current default tab group: ',userDefaultTabGroup.current)
// I should be using a class here 
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

  

  // I need to set the position property on the tab object to the new position
  // But I should probably batch this rather than write to db every time

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      }
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // const getUserTabGroupPos = (id: number) => userTabGroups.findIndex((userTab) => userTab.id === id);

  function onDragStart(event: DragStartEvent) {
    console.log("DRAG START: ",event)
    if (event.active.data.current?.type === "tab") {
      console.log("Tab sortable index: ", event.active.data.current?.sortable.index)
      setActiveTab(event.active.data.current.tab)
    }
    if (event.active.data.current?.type === "tabGroup") {
      console.log("Tab sortable index: ", event.active.data.current?.sortable.index)
      setActiveTabGroup(event.active.data.current.tabGroup)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTabGroup(null)
    setActiveTab(null)
    // active is the element we're currently dragging
    // over is the element that will be replaced once we let go of the active element
    const {active, over} = event
    if (!over) return;
    // if the same position 
    const activeId = active.id;
    const overId = over.id;

    // if they are equal, do nothing
    if (active.id === over.id) return;
   
    
    setUserTabGroups((userTabGroups) => {
      // get the original position of the element BEFORE dragging
      const activeTabGroupIndex = userTabGroups.findIndex((userTabGroup) => userTabGroup.id === activeId);
      // get the new position of where it should be after the array has updated
      const overTabGroupIndex = userTabGroups.findIndex((userTabGroup) => userTabGroup.id === overId);

      return arrayMove(userTabGroups, activeTabGroupIndex, overTabGroupIndex)
    }
  )
    
  } 

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    console.log('Dragging')
    console.log('active id' ,active.id)
    // seems to be hovering over itself!
    console.log('over.id', over?.id)

    // we are not dragging over an element
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // if they are equal, do nothing
    if (activeId === overId) return;

    const isActiveTab = active.data.current?.type === "tab";
    const isOverTab = over.data.current?.type === "tab";

    if (!isActiveTab) return;

    // im dropping a task over another task
    if (isActiveTab && isOverTab) {
        setUserTabs((userTabs) => {
          // 
            const activeIndex = userTabs.findIndex((t) => t.id === activeId);
            const overIndex = userTabs.findIndex((t) => t.id === overId);

            // if the task is being hovered over another column, set the tasks activeIndex to the new columnId
            userTabs[activeIndex].tab_group_id = userTabs[overIndex].tab_group_id;
            // set the 'position' of the tab
            userTabs[activeIndex].position = overIndex;
            return arrayMove(userTabs, activeIndex, overIndex)
        });
    }

    // im dropping a task over a column
    const isOverAUserTabGroup = over.data.current?.type === "tabGroup";

    // If I have an active tab, and I am hovering over a tab group
    if (isActiveTab && isOverAUserTabGroup) {
      // this doesn't seem to happen although the tabs are moving into the right groups
      console.log('over user tab group',over.data.current?.type);
      // 
        setUserTabs((userTabs) => {
          // find the index of the active tab in the userTabs array
            const activeIndex = userTabs.findIndex((t) => t.id === activeId);
            console.log('userTabs activeindex: ',activeIndex)

            // Convert overId to number
            const overIdAsNumber = typeof overId === 'string' ? parseInt(overId, 10) : overId;

            // if the task is being hovered over another column, set the tasks activeIndex to the new columnId
            userTabs[activeIndex].tab_group_id = overIdAsNumber
            console.log('tabs[activeindex].tab_group_id', userTabs[activeIndex].tab_group_id)

            // triggering a re-render of the array
            return arrayMove(userTabs, activeIndex, activeIndex)
        })
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
      
      
      <DndContext 
      sensors={sensors} 
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd} 
      onDragOver={onDragOver}
      collisionDetection={closestCorners}>
      <Box sx={{ flexGrow: 1, maxWidth: '80%' }}>
        <SortableContext items={userTabGroupsId}>
          {userTabGroups.map((tabGroup: TabGroupRow) => (
              <TabGroup 
              key={tabGroup.id} 
              tabGroup={tabGroup} 
              userTabs={userTabs.filter((tab) => tab.tab_group_id === tabGroup.id)} 
              handleDelete={handleDelete}
              />
            ))
          }
        </SortableContext>
      </Box>
      {createPortal(
        <DragOverlay>
          {activeTabGroup && (
              <TabGroup 
              key={activeTabGroup.id} 
              tabGroup={activeTabGroup} 
              userTabs={userTabs.filter((tab) => tab.tab_group_id === activeTabGroup.id)} 
              handleDelete={handleDelete}
              />
            )
          }
          {activeTab && (
            <SavedTab
            key={activeTab.id} 
            tab={activeTab} 
            handleDelete={handleDelete}
            />)
          }
        </DragOverlay>,
        document.body
      )}
      </DndContext>
    </>
  )
}

export default Homepage
