import { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useSocket } from '../../hooks/useSocket'
import type { ChatMessage } from '@crimia/shared-types'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-sm shrink-0">
        📍
      </div>
      <div className="bg-noir-700 rounded-lg px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isPlayer = message.role === 'player'
  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isPlayer ? 'flex-row-reverse' : ''}`}>
      {!isPlayer && (
        <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-sm shrink-0">
          📍
        </div>
      )}
      <div
        className={`max-w-xs lg:max-w-md rounded-lg px-4 py-3 ${
          isPlayer
            ? 'bg-crimson-600/30 border border-crimson-600/40 text-white'
            : 'bg-noir-700 border border-noir-600 text-slate-200'
        }`}
      >
        {!isPlayer && (
          <p className="text-xs font-mono text-amber-400 mb-1">{message.agentName}</p>
        )}
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p className="text-xs text-slate-500 mt-1 text-right font-mono">
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export default function SceneInspector({ nodeId }: { nodeId: string }) {
  const { chatHistory, typingNodes, session, clues, addMessage, loadNodeHistory } = useGameStore()
  const socket = useSocket()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = chatHistory[nodeId] ?? []
  const isTyping = typingNodes[nodeId] ?? false
  const location = session?.locations?.find((l: { id: string }) => l.id === nodeId)

  const collectedClueIds = new Set(clues.map((c) => c.id))
  const locationClues = (location?.elements ?? []).filter(
    (e: { clue: boolean; clueId?: string }) => e.clue && e.clueId && collectedClueIds.has(e.clueId)
  )

  useEffect(() => {
    if (session?.sessionId) loadNodeHistory(session.sessionId, nodeId)
  }, [nodeId, session?.sessionId, loadNodeHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    addMessage(nodeId, {
      id: Date.now().toString(),
      role: 'player',
      text,
      timestamp: new Date().toISOString(),
    })

    socket.sendMessage(nodeId, text)
    setTimeout(() => setSending(false), 500)
  }

  if (!location) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 border-b border-noir-700 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              📍
            </div>
            <div>
              <h3 className="font-mono text-sm text-white">{location.name}</h3>
              <p className="text-xs text-amber-400/70 font-mono">Local investigável</p>
            </div>
          </div>
          {locationClues.length > 0 && (
            <span className="badge border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs">
              {locationClues.length} pista{locationClues.length > 1 ? 's' : ''} encontrada{locationClues.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Macro description — sempre visível no topo */}
      {location.description && (
        <div className="px-6 py-4 border-b border-noir-700/50 bg-noir-900/50 shrink-0">
          <p className="text-sm text-slate-400 leading-relaxed">
            {location.description}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm font-mono mt-10 space-y-2">
            <p>Examine o local descrevendo o que quer investigar</p>
            <p className="text-xs text-slate-600">Ex: "Examino a taça de vinho" ou "Olho embaixo da mesa"</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-noir-700 shrink-0">
        <div className="flex gap-3">
          <input
            className="input flex-1 text-sm disabled:opacity-50"
            placeholder={isTyping ? 'Aguardando resposta...' : 'O que você quer examinar ou fazer?'}
            value={input}
            disabled={isTyping || sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || isTyping}
            className="btn-primary px-4 disabled:opacity-50"
          >
            {isTyping ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
            ) : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
