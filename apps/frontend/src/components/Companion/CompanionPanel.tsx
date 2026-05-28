import { useState } from 'react'
import { toast } from 'sonner'
import { useGameStore } from '../../store/gameStore'
import { apiFetch } from '../../lib/apiFetch'

interface CompanionMessage {
  id: string
  role: 'companion' | 'player'
  text: string
}

export default function CompanionPanel() {
  const { session } = useGameStore()
  const sessionId = session?.sessionId
  const [messages, setMessages] = useState<CompanionMessage[]>([
    {
      id: '0',
      role: 'companion',
      text: 'Olá, parceiro! Estou aqui para ajudar. Me pergunte sobre as pistas ou peça sugestões.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'player', text },
    ])
    setLoading(true)

    try {
      const res = await apiFetch(`/api/sessions/${sessionId}/companion`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao contatar parceiro')
        return
      }
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'companion', text: data.reply },
      ])
    } catch {
      toast.error('Erro de conexão com o parceiro IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col border-b border-noir-700" style={{ height: '50%' }}>
      <div className="px-4 py-3 border-b border-noir-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">🕵️</span>
          <h3 className="font-mono text-xs text-green-400 uppercase tracking-widest">Parceiro IA</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-xs rounded p-2 ${
              msg.role === 'companion'
                ? 'bg-green-400/10 border border-green-400/20 text-slate-300'
                : 'bg-noir-700 text-slate-400 ml-4'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-500 animate-pulse font-mono">Parceiro pensando...</div>
        )}
      </div>
      <div className="p-3 border-t border-noir-700 shrink-0">
        <div className="flex gap-2">
          <input
            className="input flex-1 text-xs py-1.5"
            placeholder="Peça ajuda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading} className="btn-primary px-3 text-xs py-1.5">
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
