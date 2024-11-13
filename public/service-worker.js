// Allows users to open the side panel by clicking on the action toolbar icon

  chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
  

chrome.commands.onCommand.addListener((command) => {
  if (command === "save_tab") {
    console.log(`Save tab triggered`);
    sendTabToApp();
  } else if (command === "open_sidebar") {
    console.log(`open sidebar triggered`);
    // togglePanel();
    chrome.sidePanel.getOptions
    
  }
});

const sendTabToApp = async () => {
  let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      console.log('tab = ', activeTab)
      // Send the tab info to the React app
      chrome.runtime.sendMessage({ message: "Tab Info", data: activeTab });

}

