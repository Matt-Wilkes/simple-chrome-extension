// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));


chrome.commands.onCommand.addListener((command) => {
  if (command === "save_tab") {
    console.log(`Save tab triggered`);
  } else if (command === "open_sidebar") {
    console.log(`open sidebar triggered`);
  }
});

