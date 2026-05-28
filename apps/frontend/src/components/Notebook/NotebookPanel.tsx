import { useState } from 'react'
import { toast } from 'sonner'
import { useGameStore } from '../../store/gameStore'
import { apiFetch } from '../../lib/apiFetch'

export default function NotebookPanel({ compact = false }: { compact?: boolean }) {
  const { clues, notebookText, setNotebookText, session } = useGameStore()

  if (compact) {
    return (
      <div className="flex-1 flex flex-col border-t border-noir-700 min-h-0">
        <div className="px-4 py-3 border-b border-noir-700 shrink-0">
          <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest">
            Pistas ({clues.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {clues.length === 0 && (
            <p className="text-xs text-slate-500 font-mono text-center py-4">
              Nenhuma pista coletada
            </p>
          )}
          {clues.map((clue) => (
            <div key={clue.id} className="px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded text-xs">
              <p className="font-mono text-amber-400 mb-0.5">{clue.title}</p>
              <p className="text-slate-400">{clue.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-noir-700 shrink-0">
        <h3 className="font-serif text-xl text-white">Caderno do Detetive</h3>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-6 pt-4 pb-6 gap-4 min-h-0">
        {/* Clues — scroll próprio, ocupa no máximo 40% */}
        <div className="flex flex-col min-h-0" style={{ maxHeight: '40%' }}>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3 shrink-0">
            Pistas Coletadas ({clues.length})
          </p>
          {clues.length === 0 ? (
            <p className="text-sm text-slate-500 font-mono">Explore locais para encontrar pistas</p>
          ) : (
            <div className="overflow-y-auto space-y-2 pr-1">
              {clues.map((clue) => (
                <div key={clue.id} className="card border-amber-400/20 bg-amber-400/5">
                  <p className="font-mono text-xs text-amber-400 mb-1">{clue.title}</p>
                  <p className="text-sm text-slate-300">{clue.description}</p>
                  {clue.location && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">Local: {clue.location}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes — ocupa o espaço restante */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3 shrink-0">
            Anotações Livres
          </p>
          <textarea
            className="input flex-1 resize-none font-mono text-sm leading-relaxed min-h-0"
            placeholder="Anote suas teorias, conexões e observações..."
            value={notebookText}
            onChange={(e) => setNotebookText(e.target.value)}
          />
        </div>

        {/* Submit theory */}
        {session && (
          <div className="shrink-0">
            <SubmitTheoryButton sessionId={session.sessionId} />
          </div>
        )}
      </div>
    </div>
  )
}

function SubmitTheoryButton({ sessionId }: { sessionId: string }) {
  const { notebookText } = useGameStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!notebookText.trim()) return
    const confirmed = window.confirm(
      'Tem certeza que deseja submeter sua teoria? Esta ação encerrará o caso.'
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ theory: notebookText }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? `Erro ${res.status} ao submeter teoria`)
        return
      }
      window.location.href = `/result/${sessionId}`
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={!notebookText.trim() || submitting}
      className="btn-primary w-full py-3 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {submitting ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Avaliando teoria...
        </>
      ) : (
        'Submeter Teoria Final'
      )}
    </button>
  )
}
