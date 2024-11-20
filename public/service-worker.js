chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

//developer.chrome.com/docs/extensions/reference/api/sidePanel
https: chrome.commands.onCommand.addListener((command, tab) => {
  (async () => {
    if (command === "save_tab") {
      console.log(`Save tab triggered`);
      // const tabData = await getCurrentTab();
      sendTabToApp()
    } else if (command === "open_sidebar") {
      console.log(`open sidebar triggered`);
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  })();
});

async function sendTabToApp() {
  const activeTab = await getCurrentTab();
  try {
    chrome.storage.local.get("tabsData", async (result) => {
      const tabsData = await result.tabsData || [];
      // console.log("Existing tabs data:", tabsData);
      await tabsData.push(activeTab);
      chrome.storage.local.set({ tabsData }, () => {
        console.log("Tab data added and saved:", activeTab);
      });
    });
  } catch (error) {
    console.error("Error storing tab:", error);
  }
}

async function getCurrentTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}
