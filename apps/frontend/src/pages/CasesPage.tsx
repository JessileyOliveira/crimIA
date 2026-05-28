import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CaseListItem } from '@crimia/shared-types'
import { useAuthStore } from '../store/authStore'
import { apiFetch } from '../lib/apiFetch'

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  normal: { label: 'Normal', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  hard: { label: 'Difícil', color: 'text-crimson-400 border-crimson-400/30 bg-crimson-400/10' },
}

interface SessionHistory {
  sessionId: string
  caseId: string
  caseTitle: string
  difficulty: string
  score: number | null
  finished: boolean
  createdAt: string
}

export default function CasesPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [cases, setCases] = useState<CaseListItem[]>([])
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<'easy' | 'normal'>('normal')
  const [starting, setStarting] = useState(false)
  const [tab, setTab] = useState<'cases' | 'history'>('cases')

  useEffect(() => {
    Promise.all([
      fetch('/api/cases').then((r) => r.json()),
      apiFetch('/api/auth/history').then((r) => r.json()),
    ])
      .then(([casesData, historyData]) => {
        setCases(casesData)
        setHistory(Array.isArray(historyData) ? historyData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async () => {
    if (!selected) return
    setStarting(true)
    try {
      const res = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ caseId: selected, mode }),
      })
      const session = await res.json()
      navigate(`/game/${session.id}`)
    } finally {
      setStarting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-noir-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white text-sm font-mono flex items-center gap-2 mb-4 transition-colors"
            >
              ← Voltar
            </button>
            <h2 className="font-serif text-3xl text-white">Investigações</h2>
            <p className="text-slate-400 text-sm mt-1">
              Bem-vindo, <span className="text-white">{user?.name}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 text-xs font-mono uppercase tracking-widest mt-1 transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-noir-700">
          <button
            onClick={() => setTab('cases')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              tab === 'cases'
                ? 'text-white border-b-2 border-crimson-600 -mb-px'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Casos Disponíveis
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              tab === 'history'
                ? 'text-white border-b-2 border-crimson-600 -mb-px'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Minhas Investigações {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400 font-mono animate-pulse">Carregando...</div>
          </div>
        ) : tab === 'cases' ? (
          <>
            <div className="grid gap-4">
              {cases.map((c) => {
                const diff = DIFFICULTY_LABELS[c.difficulty] ?? DIFFICULTY_LABELS.normal
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`card text-left transition-all duration-200 hover:border-crimson-600/50 ${
                      selected === c.id ? 'border-crimson-600 bg-noir-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif text-xl text-white mb-1">{c.title}</h3>
                        <p className="text-slate-400 text-sm">{c.description}</p>
                      </div>
                      <span className={`badge border ${diff.color} ml-4 shrink-0`}>
                        {diff.label}
                      </span>
                    </div>
                    {selected === c.id && (
                      <div className="mt-4 pt-4 border-t border-noir-600">
                        <p className="text-xs text-slate-400 font-mono mb-3">Modo de jogo:</p>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMode('normal') }}
                            className={`flex-1 py-2 rounded border text-sm font-mono transition-colors ${
                              mode === 'normal'
                                ? 'border-crimson-600 bg-crimson-600/20 text-crimson-400'
                                : 'border-noir-600 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            Normal
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMode('easy') }}
                            className={`flex-1 py-2 rounded border text-sm font-mono transition-colors ${
                              mode === 'easy'
                                ? 'border-green-600 bg-green-600/20 text-green-400'
                                : 'border-noir-600 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            Fácil + Parceiro IA
                          </button>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {selected && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="btn-primary px-8 py-3 text-base uppercase tracking-widest disabled:opacity-50"
                >
                  {starting ? 'Iniciando...' : 'Começar Investigação →'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {history.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 font-mono text-sm">Nenhuma investigação iniciada ainda.</p>
                <button onClick={() => setTab('cases')} className="btn-secondary mt-4 text-sm">
                  Iniciar uma investigação
                </button>
              </div>
            ) : (
              <>
                {history.filter((h) => !h.finished).length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Em andamento</p>
                    <div className="space-y-3">
                      {history.filter((h) => !h.finished).map((h) => {
                        const diff = DIFFICULTY_LABELS[h.difficulty] ?? DIFFICULTY_LABELS.normal
                        return (
                          <button
                            key={h.sessionId}
                            onClick={() => navigate(`/game/${h.sessionId}`)}
                            className="card w-full text-left hover:border-crimson-600/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-serif text-lg text-white">{h.caseTitle}</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  Iniciado em {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`badge border ${diff.color}`}>{diff.label}</span>
                                <span className="text-xs font-mono text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-1 rounded">
                                  Continuar →
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {history.filter((h) => h.finished).length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Concluídos</p>
                    <div className="space-y-3">
                      {history.filter((h) => h.finished).map((h) => {
                        const diff = DIFFICULTY_LABELS[h.difficulty] ?? DIFFICULTY_LABELS.normal
                        const scoreColor =
                          (h.score ?? 0) >= 80 ? 'text-green-400'
                          : (h.score ?? 0) >= 50 ? 'text-amber-400'
                          : 'text-crimson-400'
                        return (
                          <button
                            key={h.sessionId}
                            onClick={() => navigate(`/result/${h.sessionId}`)}
                            className="card w-full text-left hover:border-slate-600 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-serif text-lg text-white">{h.caseTitle}</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`badge border ${diff.color}`}>{diff.label}</span>
                                <span className={`font-serif text-2xl font-bold ${scoreColor}`}>
                                  {h.score !== null ? `${h.score}%` : '—'}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
