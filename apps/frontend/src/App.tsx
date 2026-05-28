import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CasesPage from './pages/CasesPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthGuard from './components/AuthGuard'
import GroqKeyModal from './components/GroqKeyModal'
import { useAuthStore } from './store/authStore'
import { useGroqKeyStore } from './store/groqKeyStore'

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const hasKey = useGroqKeyStore((s) => s.hasKey())

  return (
    <>
      {isAuthenticated && !hasKey && <GroqKeyModal />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cases" element={<AuthGuard><CasesPage /></AuthGuard>} />
        <Route path="/game/:sessionId" element={<AuthGuard><GamePage /></AuthGuard>} />
        <Route path="/result/:sessionId" element={<AuthGuard><ResultPage /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
