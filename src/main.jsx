import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('=============================================');
console.log('DEPLOYMENT VERSION:V38 (ACTIVE)');
console.log('=============================================');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
