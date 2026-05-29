import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css' // <--- Asegurate de que esta línea quede acá puesta
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)