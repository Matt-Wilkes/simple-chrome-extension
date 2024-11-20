chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

//developer.chrome.com/docs/extensions/reference/api/sidePanel
https: chrome.commands.onCommand.addListener((command, tab) => {
  (async () => {
    if (command === "save_tab") {
      console.log(`Save tab triggered`);
      const activeTab = await getCurrentTab();
      sendTabToApp(activeTab)
    } else if (command === "open_sidebar") {
      console.log(`open sidebar triggered`);
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  })();
});

async function sendTabToApp(activeTab) {
  try {
    chrome.runtime.sendMessage({ message: "tab_data", data: activeTab }, (response) => {
      if (response?.status === "success") {
        console.log("Message successfully received by sidebar:", response.data);
      } else if (chrome.runtime.lastError) {
        console.warn(`Error sending message: ${chrome.runtime.lastError} attempting to store locally..`, );
        sendTabToLocalStorage(activeTab)
      } else {
        console.log("Sidebar did not respond as expected.");
      }
    });
  } catch (error) {
    console.error("Error storing tab:", error);
  }
}

async function sendTabToLocalStorage(activeTab) {
  try {
    chrome.storage.local.get("tabsData", async (result) => {
      const tabsData = await result.tabsData || [];
      await tabsData.push(activeTab);
      chrome.storage.local.set({ tabsData }, () => {
        console.log("Tab data added to local storage:", activeTab);
      });
    })
  } catch (error) {
    console.log(error)
  };
}


async function getCurrentTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}
