import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useState } from 'react'

function App() {
// this is being stored inside the popup
  const [colour, setColour] = useState("");

  const onClick = async () => {
    // this is happening inside the page
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript<string[], void>({
      target: { tabId: tab.id!},
      // pass the colour variable into the args of the script
      args: [colour],
      // then pass it as an argument to the function
      func: (colour) => {
        document.body.style.backgroundColor = colour
      }
    });
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>My Extension</h1>
      <div className="card">
        <button onClick={() => onClick()}>
          Click me!
        </button>
        <input type="color" onChange={(e) => setColour(e.currentTarget.value)}></input>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
