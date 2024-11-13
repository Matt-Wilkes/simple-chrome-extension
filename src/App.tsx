import './App.css';
import { useState, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import Homepage from './pages/home/Homepage';

// https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=chrome-extensions#configure-your-services-id
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);


interface ManifestOauth2 {
  client_id: string;
  scopes: string[];
}

interface ChromeManifest {
  oauth2?: ManifestOauth2;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  
  const authenticateWithGoogle = () => {
    const manifest = chrome.runtime.getManifest() as ChromeManifest;
    const url = new URL('https://accounts.google.com/o/oauth2/auth');

    
    if (manifest.oauth2?.client_id && manifest.oauth2?.scopes) {
      url.searchParams.set('client_id', manifest.oauth2.client_id);
      url.searchParams.set('response_type', 'id_token');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('redirect_uri', `https://${chrome.runtime.id}.chromiumapp.org`);
      url.searchParams.set('scope', manifest.oauth2.scopes.join(' '));

      // Launch WebAuthFlow to start the Google OAuth flow
      chrome.identity.launchWebAuthFlow(
        {
          url: url.href,
          interactive: true,
        },
        async (redirectedTo: string | undefined) => {
          if (chrome.runtime.lastError) {
            console.error("Authentication error:", chrome.runtime.lastError.message);
          } else if (redirectedTo) {
            const url = new URL(redirectedTo);
            const params = new URLSearchParams(url.hash.substring(1));
            const idToken = params.get('id_token');

            if (idToken) {
              // Sign in with Supabase using the ID token
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
              });

              if (error) {
                console.error("Supabase sign-in error:", error.message);
              } else {
                setSession(data.session);
              }
            } else {
              console.error("ID token not found in the redirected URL");
            }
          }
        }
      );
    } else {
      console.error("OAuth client ID or scopes are missing in the manifest");
    }
  };

  return (
    <>
    {!session ? (
        <button onClick={authenticateWithGoogle}>Sign in with Google</button>
      ) : (
        // redirect to home
        // Welcome, {session.user?.email}
        <Homepage/>
      )}
    </>
  );
}