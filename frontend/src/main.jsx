import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { BattleSocketProvider } from './features/battle/context/BattleSocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BattleSocketProvider>
          <App />
        </BattleSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

