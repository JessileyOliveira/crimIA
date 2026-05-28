import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { SocketProvider } from '../store/SocketContext'
import { useSocket } from '../hooks/useSocket'
import CaseMap from '../components/Map/CaseMap'
import ChatRoom from '../components/Chat/ChatRoom'
import NotebookPanel from '../components/Notebook/NotebookPanel'
import SceneInspector from '../components/Scene/SceneInspector'
import CompanionPanel from '../components/Companion/CompanionPanel'

function GameLayout() {
  const { session, activeView } = useGameStore()
  const { connected } = useSocket()
  const navigate = useNavigate()

  return (
    <div className="h-screen bg-noir-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 bg-noir-900 border-b border-noir-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="font-serif text-crimson-500 text-lg font-bold hover:text-crimson-400 transition-colors"
          >
            CrimIA
          </button>
          <span className="text-noir-600">|</span>
          <span className="font-mono text-sm text-slate-300">{session?.caseTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs font-mono text-slate-400">{connected ? 'Conectado' : 'Desconectado'}</span>
          {session?.mode === 'easy' && (
            <span className="badge border border-green-400/30 bg-green-400/10 text-green-400">Modo Fácil</span>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Map */}
        <aside className="w-72 border-r border-noir-700 flex flex-col shrink-0">
          <CaseMap />
        </aside>

        {/* Center — active view */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeView.type === 'chat' && <ChatRoom nodeId={activeView.nodeId!} />}
          {activeView.type === 'scene' && <SceneInspector nodeId={activeView.nodeId!} />}
          {activeView.type === 'notebook' && <NotebookPanel />}
          {activeView.type === 'none' && (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
              Selecione um personagem ou local no mapa para começar
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="w-72 border-l border-noir-700 flex flex-col shrink-0">
          {session?.mode === 'easy' && <CompanionPanel />}
          <NotebookPanel compact />
        </aside>
      </div>
    </div>
  )
}

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, loadSession } = useGameStore()

  useEffect(() => {
    if (sessionId) loadSession(sessionId)
  }, [sessionId, loadSession])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950">
        <div className="text-slate-400 font-mono animate-pulse">Carregando investigação...</div>
      </div>
    )
  }

  return (
    <SocketProvider sessionId={sessionId!}>
      <GameLayout />
    </SocketProvider>
  )
}
