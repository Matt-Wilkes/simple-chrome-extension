import './App.css'
import { useEffect, useState } from 'react'
import { SavedUrl } from '../types';
import SavedTab from '../../components/SavedTab'
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import { createClient } from '@supabase/supabase-js'



function Homepage() {
  // this is being stored inside the popup
  const [savedLinks, setSavedLinks] = useState<SavedUrl[]>([])
  // const manifest = chrome.runtime.getManifest()
  // const auth_url = new URL(import.meta.env.VITE_GOOGLE_AUTH_URI)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabase = createClient(`${supabaseUrl}`, supabaseKey)

  

if (!supabaseKey) {
  throw new Error("Supabase key is missing in environment variables");
}

// if (manifest.oauth2?.client_id) {
//   auth_url.searchParams.set('client_id', manifest.oauth2.client_id);
// } else {
//   throw new Error("OAuth client ID is missing in the manifest.");
// }

// if (manifest.oauth2?.scopes) {
//   auth_url.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
// } else {
//   throw new Error("OAuth scopes are missing in the manifest.");
// }
  
//   auth_url.searchParams.set('response_type', 'id_token')
//   auth_url.searchParams.set('access_type', 'offline')
//   auth_url.searchParams.set('redirect_uri', `https://${chrome.runtime.id}.chromiumapp.org`)
 

    // React to changes in the savedLinks array
  useEffect(() => {
    console.log('saved links', savedLinks)
  }, [savedLinks])

  // useEffect(() => {
  //   //listener to receive messages from the service worker
  //   const handleMessage = (receivedMessage: { message: string; data: chrome.tabs.Tab }) => {
  //     if (receivedMessage?.message === "Tab Info") {
  //       console.log("Received tab info:", receivedMessage.data);
  //       updateSavedLinks(modifyTabData(receivedMessage.data));
  //     }
  //   };

  //     // Attach the listener for runtime messages
  //   chrome.runtime.onMessage.addListener(handleMessage);

  //   // Clean up the listener on component unmount
  //   return () => chrome.runtime.onMessage.removeListener(handleMessage);
  // }, []);

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {
    const { data } = await supabase.from("countries").select("*");
    console.log(data);
  }

  // chrome.identity.launchWebAuthFlow(
  //   {
  //     url: auth_url.href,
  //     interactive: true,
  //   },
  //   async (redirectedTo) => {
  //     if (chrome.runtime.lastError) {
  //       // auth was not successful
  //     } else {
  //       // auth was successful, extract the ID token from the redirectedTo URL
  //       if (redirectedTo) {
  //         const url = new URL(redirectedTo)
  //         const params = new URLSearchParams(url.hash)
  
  //         const { data, error } = await supabase.auth.signInWithIdToken({
  //         provider: 'google',
  //         token: params.get('id_token') || '',
  //       })
  //       console.log(data, error)

  //       }
        
  //     }
  //   }
  // )

  function shortenUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host;

    } catch (error) {
      console.error("Invalid Url", error);
      return url;
    }
  }

  async function handleClick() {
    let [activeTab] = await chrome.tabs.query({ active: true });
    updateSavedLinks(modifyTabData(activeTab))
  }

  const modifyTabData = (tabData: chrome.tabs.Tab) => {

    let parsed = shortenUrl(`${tabData.url}`);

    const newTab = {
      url: `${tabData.url}`,
      parsedUrl: parsed,
      description: `${tabData.title}`,
      favicon: `${tabData.favIconUrl}`
    }

    return newTab
  }

  const updateSavedLinks = async (modifiedTab: SavedUrl) => {
    setSavedLinks(prevSavedLinks => [...prevSavedLinks, modifiedTab])
  }


  return (
    <>
      <h1>Up Next</h1>
      <div className="card">
        <button onClick={() => handleClick()}>
          Add to up next
        </button>
      </div>
      <Box sx={{ flexGrow: 1, maxWidth: '100%' }}>
        {/* <Grid container spacing={5}> */}
        {/* <Grid size={{xs:12, md:6}}> */}
        <List
        >
          {savedLinks.map((item: SavedUrl) => {
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
