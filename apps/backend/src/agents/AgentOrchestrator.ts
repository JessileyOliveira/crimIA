import type { Server } from 'socket.io'
import type { CaseCharacter, CaseLocation } from '@crimia/shared-types'
import { callCharacterAgent } from './CharacterAgent'
import { GameSession } from '../game/GameSession'

interface CaseContext {
  characters: Pick<CaseCharacter, 'id' | 'name' | 'role'>[]
  locations: Pick<CaseLocation, 'id' | 'name'>[]
}

export class AgentOrchestrator {
  constructor(private io: Server) {}

  async handleSingleAgent(
    sessionId: string,
    nodeId: string,
    character: CaseCharacter,
    userMessage: string,
    ctx: CaseContext,
    apiKey: string,
  ): Promise<string> {
    const session = new GameSession(sessionId)

    this.io.to(sessionId).emit('agent_typing', { nodeId })

    const playerMsg = {
      id: `${Date.now()}-player`,
      role: 'player' as const,
      text: userMessage,
      timestamp: new Date().toISOString(),
    }
    await session.appendDisplayMessage(nodeId, playerMsg)

    const history = await session.getChatHistory(nodeId)
    const reply = await callCharacterAgent(character, history, userMessage, ctx, apiKey)

    const agentMsg = {
      id: `${Date.now()}-${nodeId}`,
      role: 'agent' as const,
      agentId: nodeId,
      agentName: character.name,
      text: reply,
      timestamp: new Date().toISOString(),
    }

    await session.appendChatHistory(nodeId, { role: 'user', content: userMessage })
    await session.appendChatHistory(nodeId, { role: 'assistant', content: reply })
    await session.appendDisplayMessage(nodeId, agentMsg)

    this.io.to(sessionId).emit('agent_reply', { nodeId, message: agentMsg })
    return reply
  }

  async handleGroupAgents(
    sessionId: string,
    roomId: string,
    characters: CaseCharacter[],
    userMessage: string,
    ctx: CaseContext,
    apiKey: string,
  ): Promise<void> {
    const session = new GameSession(sessionId)
    const responses: { agentId: string; text: string }[] = []

    const playerMsg = {
      id: `${Date.now()}-player`,
      role: 'player' as const,
      text: userMessage,
      timestamp: new Date().toISOString(),
    }
    await session.appendDisplayMessage(roomId, playerMsg)

    for (const character of characters) {
      this.io.to(sessionId).emit('agent_typing', { nodeId: character.id })

      const history = await session.getChatHistory(roomId)
      const priorReplies = responses
        .map((r) => `${characters.find((c) => c.id === r.agentId)?.name}: ${r.text}`)
        .join('\n')

      const contextualMessage = priorReplies
        ? `${userMessage}\n\n[Respostas anteriores nesta sala:\n${priorReplies}]`
        : userMessage

      const reply = await callCharacterAgent(character, history, contextualMessage, ctx, apiKey)
      responses.push({ agentId: character.id, text: reply })

      const agentMsg = {
        id: `${Date.now()}-${character.id}`,
        role: 'agent' as const,
        agentId: character.id,
        agentName: character.name,
        text: reply,
        timestamp: new Date().toISOString(),
      }

      await session.appendChatHistory(roomId, { role: 'assistant', content: `${character.name}: ${reply}` })
      await session.appendDisplayMessage(roomId, agentMsg)

      this.io.to(sessionId).emit('agent_reply', { nodeId: roomId, message: agentMsg })

      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    await session.appendChatHistory(roomId, { role: 'user', content: userMessage })
  }
}
