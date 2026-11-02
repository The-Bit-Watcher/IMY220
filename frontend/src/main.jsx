import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App.jsx'
import { applyTheme, getTheme } from './utils/theme';

// Apply the saved theme before the first paint so the page doesn't flash
applyTheme(getTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
