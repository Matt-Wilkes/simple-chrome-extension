import './App.css';
import Homepage from './pages/home/Homepage';
import { useAuthContext } from './context/AuthProvider';
import { authenticateWithGoogle } from './utils/auth';
import { ThemeProvider } from '@mui/material';
import theme from './components/createTheme';


export default function App() {

  const { session, setSession } = useAuthContext();


  return (
    <>
    <ThemeProvider theme={theme}>
    {!session ? (
        <button onClick={() => authenticateWithGoogle(setSession)}>Sign in with Google</button>
      ) : (
        // render home - Think I need a better solution here
        <Homepage />
      )}
       </ThemeProvider>
    </>
  );
}