import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: { background: '#1a1a2e', border: '1px solid #3d1a1a', color: '#e2e8f0' },
          classNames: { error: 'border-crimson-600/50' },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
