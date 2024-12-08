import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#99ccfa',
      main: '#5ba8f5',
      dark: '#458be4',
    //   contrastText: '#fff',
    },
    secondary: {
      light: '#facb96',
      main: '#f5a85b',
      dark: '#ec914d',
    //   contrastText: '#000',
    },
  },
});

export default theme