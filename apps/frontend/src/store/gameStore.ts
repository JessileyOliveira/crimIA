import { create } from 'zustand'
import type { GameSessionState, Clue, ChatMessage, NodeStatus } from '@crimia/shared-types'

type ActiveView =
  | { type: 'none' }
  | { type: 'chat'; nodeId: string }
  | { type: 'scene'; nodeId: string }
  | { type: 'notebook' }

interface GameStore {
  session: GameSessionState | null
  activeView: ActiveView
  clues: Clue[]
  chatHistory: Record<string, ChatMessage[]>
  nodeStatuses: Record<string, NodeStatus>
  notebookText: string
  typingNodes: Record<string, boolean>

  loadSession: (sessionId: string) => Promise<void>
  loadNodeHistory: (sessionId: string, nodeId: string) => Promise<void>
  setActiveView: (view: ActiveView) => void
  addClue: (clue: Clue) => void
  addMessage: (nodeId: string, message: ChatMessage) => void
  unlockNode: (nodeId: string) => void
  setNotebookText: (text: string) => void
  setTyping: (nodeId: string, isTyping: boolean) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  activeView: { type: 'none' },
  clues: [],
  chatHistory: {},
  nodeStatuses: {},
  notebookText: '',
  typingNodes: {},

  loadSession: async (sessionId) => {
    const res = await fetch(`/api/sessions/${sessionId}`)
    const data = await res.json()
    set({
      session: data.session,
      clues: data.clues ?? [],
      notebookText: data.notebook ?? '',
      nodeStatuses: data.nodeStatuses ?? {},
    })
  },

  loadNodeHistory: async (sessionId, nodeId) => {
    const existing = get().chatHistory[nodeId]
    if (existing && existing.length > 0) return
    try {
      const res = await fetch(`/api/sessions/${sessionId}/chat/${nodeId}`)
      const messages: ChatMessage[] = await res.json()
      if (messages.length > 0) {
        set((state) => ({
          chatHistory: { ...state.chatHistory, [nodeId]: messages },
        }))
      }
    } catch { /* silently ignore */ }
  },

  setActiveView: (view) => set({ activeView: view }),

  addClue: (clue) =>
    set((state) => ({ clues: [...state.clues.filter((c) => c.id !== clue.id), clue] })),

  addMessage: (nodeId, message) =>
    set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        [nodeId]: [...(state.chatHistory[nodeId] ?? []), message],
      },
    })),

  unlockNode: (nodeId) =>
    set((state) => ({
      nodeStatuses: { ...state.nodeStatuses, [nodeId]: 'unlocked' },
      session: state.session
        ? {
            ...state.session,
            unlockedNodes: state.session.unlockedNodes.includes(nodeId)
              ? state.session.unlockedNodes
              : [...state.session.unlockedNodes, nodeId],
          }
        : null,
    })),

  setNotebookText: (text) => {
    set({ notebookText: text })
    const { session } = get()
    if (session) {
      fetch(`/api/sessions/${session.sessionId}/notebook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook: text }),
      }).catch(() => {})
    }
  },

  setTyping: (nodeId, isTyping) =>
    set((state) => ({
      typingNodes: { ...state.typingNodes, [nodeId]: isTyping },
    })),
}))
