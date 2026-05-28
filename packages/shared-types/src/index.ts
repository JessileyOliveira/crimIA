// ─── Case Structure ───────────────────────────────────────────────────────────

export interface CaseCharacter {
  id: string
  name: string
  role?: string
  unlocked: boolean
  unlockTrigger?: string
  personality: string
  knows: string[]
  hides: string[]
}

export interface SceneElement {
  id: string
  label: string
  clue: boolean
  clueId?: string
  clueDescription?: string
  description?: string
}

export interface CaseLocation {
  id: string
  name: string
  description?: string
  unlocked: boolean
  unlockTrigger?: string
  elements?: SceneElement[]
}

export interface MasterDoc {
  suspect: string
  motive: string
  method: string
  location: string
  time: string
  details?: string
}

export interface CaseData {
  id: string
  title: string
  difficulty: 'easy' | 'normal' | 'hard'
  description?: string
  masterDoc: MasterDoc
  nodes: {
    characters: CaseCharacter[]
    locations: CaseLocation[]
  }
}

export interface CaseListItem {
  id: string
  title: string
  difficulty: string
  description: string
}

// ─── Session / Game State ─────────────────────────────────────────────────────

export interface Clue {
  id: string
  title: string
  description: string
  location?: string
  elementId?: string
}

export interface GameSession {
  id: string
  caseId: string
  mode: 'easy' | 'normal'
}

export interface GameSessionState {
  sessionId: string
  caseId: string
  caseTitle: string
  mode: 'easy' | 'normal'
  unlockedNodes: string[]
  clues: Clue[]
  notebook: string
  characters: CaseCharacter[]
  locations: CaseLocation[]
}

export type NodeStatus = 'locked' | 'unlocked'

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'player' | 'agent'
  agentId?: string
  agentName?: string
  text: string
  timestamp: string
}

// ─── Score ────────────────────────────────────────────────────────────────────

export interface ScoreDimension {
  score: number
  feedback: string
}

export interface FinalScore {
  dimensions: Record<string, ScoreDimension>
  total: number
  narrative: string
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  agent_reply: (data: { nodeId: string; message: ChatMessage }) => void
  agent_typing: (data: { nodeId: string }) => void
  node_unlocked: (data: { nodeId: string }) => void
  clue_found: (data: { clue: Clue }) => void
}

export interface ClientToServerEvents {
  player_message: (data: {
    sessionId: string
    nodeId: string
    text: string
    participants?: string[]
  }) => void
  inspect_element: (data: {
    sessionId: string
    nodeId: string
    elementId: string
  }) => void
}
