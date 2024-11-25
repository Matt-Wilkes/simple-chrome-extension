import './App.css';
import Homepage from './pages/home/Homepage';
import { useAuthContext } from './context/AuthProvider';
import { authenticateWithGoogle } from './utils/auth';


// interface ManifestOauth2 {
//   client_id: string;
//   scopes: string[];
// }

// interface ChromeManifest {
//   oauth2?: ManifestOauth2;
// }

export default function App() {

  const { session, setSession } = useAuthContext();


  return (
    <>
    {!session ? (
        <button onClick={() => authenticateWithGoogle(setSession)}>Sign in with Google</button>
      ) : (
        // render home - Think I need a better solution here
        <Homepage />
      )}
    </>
  );
}