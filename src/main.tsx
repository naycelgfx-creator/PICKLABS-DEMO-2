import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { RookieModeProvider } from './contexts/RookieModeContext'
import { SportsbookProvider } from './contexts/SportsbookContext'
import { LiveBetsProvider } from './contexts/LiveBetsContext'
import { TicketCartProvider } from './contexts/TicketCartContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SportsbookProvider>
      <LiveBetsProvider>
        <RookieModeProvider>
          <TicketCartProvider>
            <App />
          </TicketCartProvider>
        </RookieModeProvider>
      </LiveBetsProvider>
    </SportsbookProvider>
  </StrictMode>,
)
