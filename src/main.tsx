import  React  from 'react'
import  ReactDOM  from 'react-dom/client'
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from './App.tsx'
import Homepage from './pages/home/Homepage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';


// CreateBrowserRouter can't be used with chrome ext
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundPage />
  },
  {
    path: '/homepage',
    element: <Homepage />,
    errorElement: <NotFoundPage />
  }
], {
  future: {
    v7_relativeSplatPath: true, 
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* defer the entry point to react router */}
    <RouterProvider router={router} future={{
    v7_startTransition: true,
  }} />
  </React.StrictMode>
);
