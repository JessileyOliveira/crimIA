import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { FinalScore } from '@crimia/shared-types'

type ResultData = FinalScore & { finalTheory: string | null }

const DIMENSION_LABELS: Record<string, string> = {
  suspect: 'Suspeito',
  motive: 'Motivo',
  method: 'Método',
  location: 'Local',
  time: 'Horário',
}

function ScoreBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-400' : 'bg-crimson-500'
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-sm text-slate-300">{label}</span>
        <span className="font-mono text-sm font-bold text-white">{score}%</span>
      </div>
      <div className="h-2 bg-noir-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{feedback}</p>
    </div>
  )
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/result`)
      .then((r) => {
        if (!r.ok) throw new Error(`Erro ${r.status}`)
        return r.json()
      })
      .then((data: ResultData) => {
        if (!data.dimensions || data.total === undefined) throw new Error('Dados incompletos')
        setResult(data)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950">
        <div className="text-slate-400 font-mono animate-pulse">Calculando resultado...</div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-noir-950 gap-4">
        <p className="text-crimson-400 font-mono text-sm">{error ?? 'Resultado não encontrado.'}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Voltar ao início
        </button>
      </div>
    )
  }

  const totalColor = result.total >= 80 ? 'text-green-400' : result.total >= 50 ? 'text-amber-400' : 'text-crimson-400'

  return (
    <div className="min-h-screen bg-noir-950 p-6">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mb-2">Caso Encerrado</p>
          <h2 className="font-serif text-4xl text-white mb-4">Resultado Final</h2>
          <div className={`font-serif text-7xl font-bold ${totalColor}`}>
            {result.total}%
          </div>
          <p className="text-slate-400 mt-2 font-mono text-sm">Precisão da teoria</p>
        </div>

        {/* Score breakdown */}
        <div className="card mb-6">
          <h3 className="font-mono text-sm text-slate-400 uppercase tracking-widest mb-6">Avaliação por Dimensão</h3>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const dim = result.dimensions[key]
            if (!dim) return null
            return <ScoreBar key={key} label={label} score={dim.score} feedback={dim.feedback} />
          })}
        </div>

        {/* Final theory submitted */}
        {result.finalTheory && (
          <div className="card mb-6 border-slate-600/30">
            <h3 className="font-mono text-sm text-slate-400 uppercase tracking-widest mb-3">Sua Teoria</h3>
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{result.finalTheory}</p>
          </div>
        )}

        {/* Narrative reveal */}
        <div className="card mb-8 border-crimson-600/30">
          <h3 className="font-mono text-sm text-crimson-400 uppercase tracking-widest mb-3">A Verdade do Caso</h3>
          <p className="text-slate-300 leading-relaxed font-serif italic">{result.narrative}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={() => navigate('/cases')} className="btn-primary flex-1 py-3">
            Novo Caso
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary flex-1 py-3">
            Início
          </button>
        </div>
      </div>
    </div>
  )
}
