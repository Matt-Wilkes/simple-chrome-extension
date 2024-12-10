import '../../App.css'
import { isEqual } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import { insertTab, TabRow, TabGroupRow, getDefaultTabGroup, insertTabGroup, deleteTabById, getAllTabsSortedByPos, getLatestTabPosition, updateTabPosition, updateTabGroup, getAllTabGroupsSortedByPos } from '../../services/supabaseService';
import { useAuthContext } from '../../context/AuthProvider';
import { TabGroup } from '../../components/TabGroup';
import { closestCorners, DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor, MeasuringStrategy } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
// import { MouseSensor, TouchSensor } from '../../utils/dndCustomSensors';
import { createPortal } from 'react-dom';
import SavedTab from '../../components/SavedTab';
import { NewTab } from '../../types';
import { Box, Button, Container } from '@mui/material';
import AccountMenu from '../../components/AccountMenu';
import AddIcon from '@mui/icons-material/Add';


function Homepage() {
  const userDefaultTabGroup = useRef<number>(0)
  const latestTabPos = useRef<number>(9999)
  const latestTabGroupPos = useRef<number>(9999)
  const { session } = useAuthContext();

  const [userTabs, setUserTabs] = useState<TabRow[]>([])
  const prevUserTabsRef = useRef<TabRow[]>([]);
  const prevUserTabGroupsRef = useRef<TabGroupRow[]>([]);

  const [activeTab, setActiveTab] = useState<TabRow | null>(null)
  const [userTabGroups, setUserTabGroups] = useState<TabGroupRow[]>([])
  // useMemo hook remembers the last value and only runs function when dependant data changes
  const userTabGroupsId = useMemo(() => userTabGroups.map((tabGroup) => tabGroup.id), [userTabGroups])
  const [activeTabGroup, setActiveTabGroup] = useState<TabGroupRow | null>(null)
  const currentTabGroupId = useRef<number>(0)

  const userTabsIds = useMemo(() => userTabs.map((tab) => tab.id), [userTabs])



  useEffect(() => {
    const fetchAndPostData = async () => {
      try {
        await fetchTabGroupsFromDb();
        await fetchTabsFromDb();
        await getLatestTabPositionFromDb();
        await checkAndPostLocalTabs();
      } catch (error) {
        console.log('error fetching data or posting local tab data', error) // better messaging needed here
      }

    }
    fetchAndPostData();
  }, [])

  useEffect(() => {
    getOrCreateDefaultTabGroup();
    console.log('user tab group has changed')
  }, []); // don't forget about this 



  useEffect(() => {
    // Listen for messages from the service worker
    if (chrome?.runtime?.id) {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
      })
    } else {
      console.log("Not running in a chrome extension env")
    };
  }, [])


  const fetchTabsFromDb = async () => {
    const data = await getAllTabsSortedByPos();
    if (data) {
      setUserTabs([...data]);
    }
  }

  const fetchTabGroupsFromDb = async () => {
    const data = await getAllTabGroupsSortedByPos();
    if (data) {
      console.log("Fetched Tab Groups:", data);
      latestTabGroupPos.current = (data.length);
      setUserTabGroups([...data]);
    }
  }

  const getLatestTabPositionFromDb = async () => {
    const data = await getLatestTabPosition();
    if (data) {
      console.log("Fetched Tab Groups:", data);
      latestTabPos.current = (data.position + 1);
    }
  }


  const checkAndPostLocalTabs = async () => {
    try {
      const tabs = await getLocalTabs()
      if (userDefaultTabGroup.current === 0 && tabs.length > 0) {
        await fetchTabsFromDb()
        await postLocalTabsToDb(tabs)
      } else if (tabs.length > 0) {
        // post the local tabs to the DB
        // console.log('local tabs = ', tabs)
        await postLocalTabsToDb(tabs)
      }
    } catch (error) {
      console.error(error)
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

    // await fetchTabsFromDb() // is this necessary? check each new tab is being written to state
  };

  function getLocalTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve, reject) => {
      if (chrome?.runtime?.id) {
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
      } else {
        resolve([])
      }
    });
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
    const modifiedTab = await modifyTabData(tab, userDefaultTabGroup.current, latestTabPos.current)
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

  const handleNewTabGroup = async () => {
    console.log(userTabGroups.length)
    const newTabGroupNumber = (userTabGroups.length + 1)
    try {
      const newTabGroup: TabGroupRow = await insertTabGroup({
        is_default: false,
        name: `New Group ${newTabGroupNumber}`,
        user_id: `${session?.user.id}`,
        position: latestTabGroupPos.current
      });
      if (newTabGroup) {
        setUserTabGroups(prevUserTabGroups => [...prevUserTabGroups, newTabGroup])
      }
    } catch (error) {
      console.log(error)
    }
    
  }

  const modifyTabData = async (tabData: chrome.tabs.Tab, defaultTabGroup: number, latestTabPos: number) => {
    console.log('modify tab, current default tab group: ', userDefaultTabGroup.current)
    // I should be using a class here 
    const newTab: NewTab = {
      description: `${tabData.title}`,
      favicon_url: `${tabData.favIconUrl}`,
      parsed_url: new URL(tabData.url || "").host,
      position: latestTabPos,
      tab_group_id: defaultTabGroup,
      url: `${tabData.url}`,
      user_id: `${session?.user.id}`
    }
    return newTab
  }


  const updateUserTabs = async (newTab: TabRow) => {
    latestTabPos.current = (newTab.position + 1)
    setUserTabs(prevUserTabs => [...prevUserTabs, newTab])
  }

  const getOrCreateDefaultTabGroup = async (): Promise<number> => {
    try {
      const defaultTabGroup = await getDefaultTabGroup();
      if (defaultTabGroup) {
        console.log('default Tab Group = ', defaultTabGroup.id)
        if (defaultTabGroup.id !== 0) {
          userDefaultTabGroup.current = defaultTabGroup.id
          return userDefaultTabGroup.current
        }
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
      throw new Error("Error getting default tab group")
    }
    throw new Error("Error getting default tab group")
  }

  const createDefaultTabGroup = async (): Promise<TabGroupRow> => {
    try {
      const newDefaultTabGroup: TabGroupRow = await insertTabGroup({
        is_default: true,
        name: 'Default',
        user_id: `${session?.user.id}`,
        position: latestTabGroupPos.current
      })
      if (newDefaultTabGroup) {
        setUserTabGroups(prevUserTabGroups => [...prevUserTabGroups, newDefaultTabGroup])
        return newDefaultTabGroup
      } else {
        throw new Error("Error creating default tab group")
      }
    } catch (error) {
      console.log("Error creating default tab group", error)
      throw new Error("Tab group couldn't be created")
    }
  }

  const changeTabGroupName = (id: number, name: string) => {
    updateTabGroup(id, {
        name: name
    })
}
  const updateDefaultTabGroup = async (id: number): Promise<number> => {
    try {
      await updateTabGroup(userDefaultTabGroup.current, {
        is_default: false
      });
      const defaultTabGroup = await updateTabGroup(id, {
        is_default: true
      })
      if (defaultTabGroup) {
        userDefaultTabGroup.current = defaultTabGroup.id
      } else {
        throw new Error("Error setting default tab group");
      }

    } catch (error) {
      console.log(error)
      // throw new Error("Error setting default tab group");
    }
    return userDefaultTabGroup.current
}


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      }
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  )

  function onDragStart(event: DragStartEvent) {
    // console.log("DRAG START: ", event)
    if (event.active.data.current?.type === "tab") {
      setActiveTab(event.active.data.current.tab)
      currentTabGroupId.current = event.active.data.current?.tabGroup
      prevUserTabsRef.current = JSON.parse(JSON.stringify(userTabs));
    }
    if (event.active.data.current?.type === "tabGroup") {
      prevUserTabGroupsRef.current = userTabGroups
      setActiveTabGroup(event.active.data.current.tabGroup)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTabGroup(null)
    setActiveTab(null)
    // active is the element we're currently dragging
    // over is the element that will be replaced once we let go of the active element
    const { active, over } = event

    if (!over) return;

    console.log('DRAG END: prevUserTabsRef.current ', prevUserTabsRef.current)
    console.log('DRAG END: userTabs ', userTabs)

    try {
      const prevUserTabs = prevUserTabsRef.current;
      // filter through user tabs
      const updatedTabs = userTabs.filter((tab) =>
        // for each tab, .some through prevUserTabs
        // if the prevTab.id is equal to the tab.id AND previous tab is not equal to current tab
        prevUserTabs.some((prevTab) => prevTab.id === tab.id && !isEqual(prevTab, tab)
        )
      );

      console.log('DRAG END Updated tabs', updatedTabs)
      updatedTabs.forEach((tab) => updateTabPosition({
        position: tab.position,
        tab_group_id: tab.tab_group_id
      }, tab.id))
    } catch (error) {
      console.log(error)
    }

   
    try {
      const prevUserTabGroups = prevUserTabGroupsRef.current;
      // filter through user tabs
      const updatedTabGroups = userTabGroups.filter((tabGroup) =>
        prevUserTabGroups.some((prevTabGroup) => prevTabGroup.id === tabGroup.id && !isEqual(prevTabGroup, tabGroup)
        )
      );

      console.log('DRAG END Updated tab Groups', updatedTabGroups)
      // set prevUserTabsRef.current to current user tabs
      updatedTabGroups.forEach((tabGroup) => updateTabGroup(tabGroup.id, {
        position: tabGroup.position
      }))

    } catch (error) {
      console.log(error)
    }
     // if they are equal, do nothing
     if (active.id === over.id) return;

  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;

    // we are not dragging over an element
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // if they are equal, do nothing
    if (activeId === overId) return;

    const isActiveTabGroup = active.data.current?.type === "tabGroup";
    const isOverTabGroup = over.data.current?.type === "tabGroup";
    const isActiveTab = active.data.current?.type === "tab";
    const isOverTab = over.data.current?.type === "tab";

    if (isActiveTabGroup && isOverTabGroup) {
      setUserTabGroups((userTabGroups) => {
        // get the original position of the element BEFORE dragging
        const activeTabGroupIndex = userTabGroups.findIndex((userTabGroup) => userTabGroup.id === activeId);
        // get the new position of where it should be after the array has updated
        const overTabGroupIndex = userTabGroups.findIndex((userTabGroup) => userTabGroup.id === overId);

        const updatedUserTabGroups = arrayMove(userTabGroups, activeTabGroupIndex, overTabGroupIndex)
  
        const newTabGroupIndexes = updatedUserTabGroups.map((tabGroup, index) => ({
          ...tabGroup,
          position: index
        }));
  
        return newTabGroupIndexes;
      }
    )
    }


    if (!isActiveTab) return;

    // im dropping a task over another task
    if (isActiveTab && isOverTab) {
      setUserTabs((userTabs) => {
        // 
        const activeIndex = userTabs.findIndex((t) => t.id === activeId);
        const overIndex = userTabs.findIndex((t) => t.id === overId);
        const sortableOverIndex = over.data.current?.sortable.index
        const overTabGroupId = over.data.current?.tabGroup

        userTabs[activeIndex].position = sortableOverIndex;
        userTabs[activeIndex].tab_group_id = overTabGroupId;

        const updatedUserTabs = arrayMove(userTabs, activeIndex, overIndex)

        // create array of tabs in the NEW group, update the position property based on their position in the array
        const newGroupIndexes = updatedUserTabs.filter(tab => tab.tab_group_id === overTabGroupId).map((item, index) => ({
          ...item,
          position: index
        }));

        // create array of tabs in the PREVIOUS group, update the position property based on their position in the array
        const prevGroupIndexes = updatedUserTabs.filter(tab => tab.tab_group_id === currentTabGroupId.current).map((item, index) => ({
          ...item,
          position: index
        }))

        const finalUpdatedUserTabs = updatedUserTabs.map((tab) => {
          if (currentTabGroupId.current != overTabGroupId) {
            const updatedTab =
            newGroupIndexes.find((item) => item.id === tab.id) ||
            prevGroupIndexes.find((item) => item.id === tab.id);

          return updatedTab || tab;
          } else {
            const updatedTab = 
            newGroupIndexes.find((item) => item.id === tab.id)

            return updatedTab || tab;
          }
          
        });
        return finalUpdatedUserTabs
      });
    }

    // If I have an active tab, and I am hovering over an empty tab group
    if (isActiveTab && isOverTabGroup) {
      const activeIndex = userTabs.findIndex((t) => t.id === activeId);
      const overTabGroupId = over.data.current?.tabGroup.id

      setUserTabs((userTabs) => {
        userTabs[activeIndex].position = 0
        userTabs[activeIndex].tab_group_id = overTabGroupId

        const updatedUserTabs = arrayMove(userTabs, activeIndex, 0)
         // create array of tabs in the NEW group, update the position property based on their position in the array
         const newGroupIndexes = userTabs.filter(tab => tab.tab_group_id === overTabGroupId).map((item, index) => ({
          ...item,
          position: index
        }));

        // create array of tabs in the PREVIOUS group, update the position property based on their position in the array
        const prevGroupIndexes = updatedUserTabs.filter(tab => tab.tab_group_id === currentTabGroupId.current).map((item, index) => ({
          ...item,
          position: index
        }))

        const finalUpdatedUserTabs = updatedUserTabs.map((tab) => {
          if (currentTabGroupId.current != overTabGroupId && prevGroupIndexes.length > 0) {
            const updatedTab =
            newGroupIndexes.find((item) => item.id === tab.id) ||
            prevGroupIndexes.find((item) => item.id === tab.id);

          return updatedTab || tab;
          } else {
            const updatedTab = 
            newGroupIndexes.find((item) => item.id === tab.id)

            return updatedTab || tab;
          }
          
        });

        return finalUpdatedUserTabs
      })

  }


  }

  return (
    <>
    <Container >
    <AccountMenu />
    <Box sx={{ maxWidth: '90%'}}>
    <h1>Tab Pocket</h1>
      <div className="card">
        <button onClick={async () => handleNewTab(await getCurrentTab())}>
          Add to Pocket
        </button>
      </div>
      </Box>
    
    {/* wraps around the tab groups and 'new tab group' button */}
    <Box sx={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={onDragOver}
        collisionDetection={closestCorners}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
        >
          
        <Box sx={{display: 'flex', flexDirection: 'column', flexGrow: 1, maxWidth: '90%', justifyContent: 'center', gap: '20px'}}>
          <SortableContext items={userTabGroupsId}>
            {userTabGroups.map((tabGroup: TabGroupRow) => (
              <TabGroup
                key={tabGroup.id}
                tabGroup={tabGroup}
                userTabs={userTabs.filter((tab) => tab.tab_group_id === tabGroup.id)}
                handleDelete={handleDelete}
                changeTabGroupName={changeTabGroupName}
                updateDefaultTabGroup={updateDefaultTabGroup}
                userTabsIds={userTabsIds}
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
                changeTabGroupName={changeTabGroupName}
                updateDefaultTabGroup={updateDefaultTabGroup}
                userTabsIds={userTabsIds} // might need to double check this
              />
            )
            }
            {activeTab && (
              // This will be the dragging element!!
              // I want this to be the same size/width - but just an empty box
              <SavedTab
                key={activeTab.id}
                tab={activeTab}
                handleDelete={handleDelete}
                tabGroupId={activeTab.tab_group_id} // might need to double check this
              />
            )
            }
          </DragOverlay>,
          document.body
        )}
        
      </DndContext>
      <Box sx={{ flexGrow: 1, maxWidth: '90%', justifyContent: 'center'}}>
        <Button
        onClick={() => handleNewTabGroup()}
        ><AddIcon/>'Add New Group'</Button>
      </Box>
      </Box>
      
      
      </Container>
    </>
  )
}

export default Homepage
