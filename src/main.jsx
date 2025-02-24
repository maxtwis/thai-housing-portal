import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import Dashboard from './pages/Dashboard.jsx'
import About from './pages/About.jsx'

// Option 1: Using BrowserRouter (current approach)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Option 2: Using RouterProvider with createBrowserRouter (newer approach)
// Uncomment this and comment out the above if you want to switch
/*
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "about",
        element: <About />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
*/