import { redis } from '../db/redis'
import { prisma } from '../db/prisma'
import type { CaseData, GameSessionState, Clue } from '@crimia/shared-types'

const SESSION_TTL = 60 * 60 * 24 // 24h

async function rget(key: string): Promise<string | null> {
  try { return await redis.get(key) } catch { return null }
}

async function rsetex(key: string, ttl: number, value: string): Promise<void> {
  try { await redis.setex(key, ttl, value) } catch { /* sem cache, sem problema */ }
}

export class GameSession {
  constructor(private sessionId: string) {}

  private key(suffix: string) {
    return `session:${this.sessionId}:${suffix}`
  }

  async getState(): Promise<GameSessionState | null> {
    const raw = await rget(this.key('state'))
    if (raw) return JSON.parse(raw) as GameSessionState

    const session = await prisma.session.findUnique({
      where: { id: this.sessionId },
      include: { case: true },
    })
    if (!session) return null

    const state: GameSessionState = {
      sessionId: this.sessionId,
      caseId: session.caseId,
      caseTitle: session.case.title,
      mode: session.mode as 'easy' | 'normal',
      unlockedNodes: (session.unlockedNodes as string[]) ?? [],
      clues: (session.clues as unknown as Clue[]) ?? [],
      notebook: session.notebook ?? '',
      characters: (session.case.nodes as unknown as CaseData['nodes']).characters,
      locations: (session.case.nodes as unknown as CaseData['nodes']).locations,
    }

    await rsetex(this.key('state'), SESSION_TTL, JSON.stringify(state))
    return state
  }

  async unlockNode(nodeId: string): Promise<void> {
    const state = await this.getState()
    if (!state || state.unlockedNodes.includes(nodeId)) return

    state.unlockedNodes.push(nodeId)
    await this.saveState(state)
    await prisma.session.update({
      where: { id: this.sessionId },
      data: { unlockedNodes: state.unlockedNodes },
    })
  }

  async addClue(clue: Clue): Promise<void> {
    const state = await this.getState()
    if (!state) return

    if (!state.clues.find((c) => c.id === clue.id)) {
      state.clues.push(clue)
      await this.saveState(state)
      await prisma.session.update({
        where: { id: this.sessionId },
        data: { clues: state.clues as object[] },
      })
    }
  }

  async updateNotebook(text: string): Promise<void> {
    const state = await this.getState()
    if (!state) return
    state.notebook = text
    await this.saveState(state)
    await prisma.session.update({
      where: { id: this.sessionId },
      data: { notebook: text },
    })
  }

  async getChatHistory(nodeId: string) {
    const raw = await rget(this.key(`chat:${nodeId}`))
    return raw ? JSON.parse(raw) : []
  }

  async appendChatHistory(nodeId: string, message: object) {
    const history = await this.getChatHistory(nodeId)
    history.push(message)
    await rsetex(this.key(`chat:${nodeId}`), SESSION_TTL, JSON.stringify(history))
    return history
  }

  async saveScore(score: object): Promise<void> {
    await rsetex(this.key('score'), SESSION_TTL, JSON.stringify(score))
    // Persiste também no banco para sobreviver restart do Redis
    await prisma.session.update({
      where: { id: this.sessionId },
      data: { scoreData: score },
    }).catch(() => { /* campo pode não existir ainda, Redis é suficiente */ })
  }

  async getScore(): Promise<object | null> {
    const raw = await rget(this.key('score'))
    return raw ? JSON.parse(raw) : null
  }

  async getDisplayHistory(nodeId: string): Promise<object[]> {
    const raw = await rget(this.key(`display:${nodeId}`))
    return raw ? JSON.parse(raw) : []
  }

  async appendDisplayMessage(nodeId: string, message: object): Promise<void> {
    const history = await this.getDisplayHistory(nodeId)
    history.push(message)
    await rsetex(this.key(`display:${nodeId}`), SESSION_TTL, JSON.stringify(history))
  }

  private async saveState(state: GameSessionState) {
    await rsetex(this.key('state'), SESSION_TTL, JSON.stringify(state))
  }

  static async create(caseId: string, mode: 'easy' | 'normal', userId?: string): Promise<string> {
    const caseData = await prisma.case.findUnique({ where: { id: caseId } })
    if (!caseData) throw new Error(`Case ${caseId} not found`)

    const nodes = caseData.nodes as unknown as CaseData['nodes']
    const initialUnlocked = [
      ...nodes.characters.filter((c) => c.unlocked).map((c) => c.id),
      ...nodes.locations.filter((l) => l.unlocked).map((l) => l.id),
    ]

    const session = await prisma.session.create({
      data: {
        caseId,
        mode,
        userId: userId ?? null,
        unlockedNodes: initialUnlocked,
        clues: [],
        notebook: '',
      },
    })

    return session.id
  }
}
