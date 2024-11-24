

export const getManifest = (): chrome.runtime.Manifest => {
    if (import.meta.env.MODE === 'development') {
      // Mock manifest for development
      return {
        oauth2: {
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
          scopes: ['openid', 'email', 'profile'],
        },
      } as unknown as chrome.runtime.Manifest;
    }
    return chrome.runtime.getManifest(); // Use real manifest in production
  };
  
  export const launchWebAuthFlow = async (url: string): Promise<string> => {
    if (import.meta.env.MODE === 'development') {
      // Mock response for development
      throw new Error('launchWebAuthFlow is not available in development mode.');
    }
  
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url, interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (redirectedTo) {
            resolve(redirectedTo);
          } else {
            reject(new Error('Unknown error: No redirection URL returned.'));
          }
        }
      );
    });
  };