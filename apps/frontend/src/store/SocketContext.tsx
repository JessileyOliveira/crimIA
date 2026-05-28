import { createContext, useEffect, useRef, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGameStore } from './gameStore'
import { useGroqKeyStore } from './groqKeyStore'
import type { ServerToClientEvents, ClientToServerEvents } from '@crimia/shared-types'

interface SocketContextValue {
  connected: boolean
  sendMessage: (nodeId: string, text: string, participants?: string[]) => void
  inspectElement: (nodeId: string, elementId: string) => void
}

export const SocketContext = createContext<SocketContextValue | null>(null)

export function SocketProvider({ sessionId, children }: { sessionId: string; children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const { addMessage, unlockNode, addClue, setTyping } = useGameStore()
  const groqApiKey = useGroqKeyStore((s) => s.apiKey)

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      query: { sessionId },
      auth: { groqApiKey: groqApiKey ?? '' },
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('agent_reply', ({ nodeId, message }) => {
      setTyping(nodeId, false)
      addMessage(nodeId, message)
    })

    socket.on('agent_typing', ({ nodeId }) => {
      setTyping(nodeId, true)
    })

    socket.on('node_unlocked', ({ nodeId }) => {
      unlockNode(nodeId)
    })

    socket.on('clue_found', ({ clue }) => {
      addClue(clue)
    })

    return () => {
      socket.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const sendMessage = (nodeId: string, text: string, participants?: string[]) => {
    socketRef.current?.emit('player_message', { sessionId, nodeId, text, participants })
  }

  const inspectElement = (nodeId: string, elementId: string) => {
    socketRef.current?.emit('inspect_element', { sessionId, nodeId, elementId })
  }

  return (
    <SocketContext.Provider value={{ connected, sendMessage, inspectElement }}>
      {children}
    </SocketContext.Provider>
  )
}
