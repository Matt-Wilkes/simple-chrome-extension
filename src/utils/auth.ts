// src/utils/auth.ts
import { supabase } from '../services/supabaseClient';
import { getManifest, launchWebAuthFlow } from './chromeApi';


export const authenticateWithGoogle = async (setSession: (session: any) => void) => {
    if (import.meta.env.MODE === 'development') {
      try {
        // Step 1: Trigger the OAuth flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:5173', // Ensure this matches your Supabase config
          },
        });
  
        if (error) {
          console.error('Supabase sign-in error:', error.message);
          return;
        }
  
        // Step 2: Fetch the session after the user is redirected
        const sessionResponse = await supabase.auth.getSession();
  
        if (sessionResponse.data.session) {
          setSession(sessionResponse.data.session);
        } else {
          console.error('No session found after authentication');
        }
      } catch (error) {
        console.error('Error during OAuth in development:', error);
      }
    } else {
      // Chrome extension environment (production)
      const manifest = getManifest();
      const url = new URL('https://accounts.google.com/o/oauth2/auth');
  
      if (manifest.oauth2?.client_id && manifest.oauth2?.scopes) {
        url.searchParams.set('client_id', manifest.oauth2.client_id);
        url.searchParams.set('response_type', 'id_token');
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('redirect_uri', `https://${chrome.runtime.id}.chromiumapp.org`);
        url.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
  
        try {
          const redirectedTo = await launchWebAuthFlow(url.href);
          const params = new URLSearchParams(new URL(redirectedTo).hash.substring(1));
          const idToken = params.get('id_token');
  
          if (idToken) {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
            });
  
            if (error) {
              console.error('Supabase sign-in error:', error.message);
            } else {
              setSession(data.session);
            }
          } else {
            console.error('ID token not found in the redirected URL');
          }
        } catch (error) {
          console.error('Authentication error:', error);
        }
      } else {
        console.error('OAuth client ID or scopes are missing in the manifest');
      }
    }
  };
  
  export async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
        console.log(`Error: ${error.message}`)
    }
  }
  