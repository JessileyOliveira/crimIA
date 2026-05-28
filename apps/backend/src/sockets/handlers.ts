import type { Server, Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@crimia/shared-types'
import { GameSession } from '../game/GameSession'
import { TriggerEngine } from '../game/TriggerEngine'
import { AgentOrchestrator } from '../agents/AgentOrchestrator'
import { callLocationAgent, detectTriggeredClues } from '../agents/LocationAgent'
import type { CaseData } from '@crimia/shared-types'
import { prisma } from '../db/prisma'

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) {
  const orchestrator = new AgentOrchestrator(io as Server)

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const { sessionId } = socket.handshake.query as { sessionId: string }
    const { groqApiKey } = socket.handshake.auth as { groqApiKey?: string }

    if (sessionId) socket.join(sessionId)

    socket.on('player_message', async ({ sessionId, nodeId, text, participants }) => {
      if (!groqApiKey) {
        const errorMsg = {
          id: `${Date.now()}-error`,
          role: 'agent' as const,
          agentId: 'system',
          agentName: 'Sistema',
          text: '⚠️ Chave de API Groq não configurada. Recarregue a página e insira sua chave.',
          timestamp: new Date().toISOString(),
        }
        io.to(sessionId).emit('agent_reply', { nodeId, message: errorMsg })
        return
      }

      try {
        const session = new GameSession(sessionId)
        const state = await session.getState()
        if (!state) return

        const isLocation = state.locations.some((l) => l.id === nodeId)
        const character = state.characters.find((c) => c.id === nodeId)

        const caseCtx = {
          characters: state.characters.map((c) => ({ id: c.id, name: c.name, role: c.role })),
          locations: state.locations.map((l) => ({ id: l.id, name: l.name })),
        }

        if (isLocation) {
          await handleLocationMessage(io, session, state, sessionId, nodeId, text, caseCtx, groqApiKey)
        } else if (character) {
          let agentReply = ''

          if (participants && participants.length > 1) {
            const chars = participants
              .map((id) => state.characters.find((c) => c.id === id))
              .filter(Boolean) as typeof state.characters
            await orchestrator.handleGroupAgents(sessionId, nodeId, chars, text, caseCtx, groqApiKey)
          } else {
            agentReply = await orchestrator.handleSingleAgent(sessionId, nodeId, character, text, caseCtx, groqApiKey)
          }

          const dbCase = await prisma.case.findUnique({ where: { id: state.caseId } })
          const nodes = dbCase?.nodes as unknown as CaseData['nodes']
          const trigger = new TriggerEngine(nodes.characters, nodes.locations)
          const newlyUnlocked = await trigger.evaluate(
            { sessionId, nodeId, text, agentReply, unlockedNodes: state.unlockedNodes },
            session,
          )
          for (const id of newlyUnlocked) {
            io.to(sessionId).emit('node_unlocked', { nodeId: id })
          }
        }
      } catch (e) {
        console.error('[socket player_message error]', e)
        const err = e as { status?: number; error?: { error?: { message?: string } } }
        if (err.status === 429) {
          const retryMsg = err.error?.error?.message?.match(/try again in (\S+)/i)?.[1] ?? 'alguns minutos'
          const errorMsg = {
            id: `${Date.now()}-error`,
            role: 'agent' as const,
            agentId: 'system',
            agentName: 'Sistema',
            text: `⚠️ Limite de requisições da IA atingido. Aguarde ${retryMsg} e tente novamente.`,
            timestamp: new Date().toISOString(),
          }
          io.to(sessionId).emit('agent_reply', { nodeId, message: errorMsg })
          io.to(sessionId).emit('agent_typing', { nodeId: `${nodeId}_stop` })
        }
      }
    })

    socket.on('inspect_element', () => {
      // deprecated — inspeção agora acontece via chat livre no local
    })

    socket.on('disconnect', () => {})
  })
}

async function handleLocationMessage(
  io: Server,
  session: GameSession,
  state: Awaited<ReturnType<GameSession['getState']>> & object,
  sessionId: string,
  nodeId: string,
  text: string,
  caseCtx: { characters: { id: string; name: string; role?: string }[]; locations: { id: string; name: string }[] },
  apiKey: string,
) {
  if (!state) return
  const location = state.locations.find((l) => l.id === nodeId)
  if (!location) return

  io.to(sessionId).emit('agent_typing', { nodeId })

  const playerMsg = {
    id: `${Date.now()}-player`,
    role: 'player' as const,
    text,
    timestamp: new Date().toISOString(),
  }
  await session.appendDisplayMessage(nodeId, playerMsg)

  const history = await session.getChatHistory(nodeId)
  const reply = await callLocationAgent(location, history, text, caseCtx, apiKey)

  const agentMsg = {
    id: `${Date.now()}-${nodeId}`,
    role: 'agent' as const,
    agentId: nodeId,
    agentName: location.name,
    text: reply,
    timestamp: new Date().toISOString(),
  }

  await session.appendChatHistory(nodeId, { role: 'user', content: text })
  await session.appendChatHistory(nodeId, { role: 'assistant', content: reply })
  await session.appendDisplayMessage(nodeId, agentMsg)

  io.to(sessionId).emit('agent_reply', { nodeId, message: agentMsg })

  const collected = new Set(state.clues.map((c) => c.id))
  const triggered = detectTriggeredClues(text, reply, location, collected)
  for (const clue of triggered) {
    await session.addClue(clue)
    io.to(sessionId).emit('clue_found', { clue })
  }

  const dbCase = await prisma.case.findUnique({ where: { id: state.caseId } })
  const nodes = dbCase?.nodes as unknown as CaseData['nodes']

  for (const loc of nodes.locations) {
    if (state.unlockedNodes.includes(loc.id) || !loc.unlockTrigger) continue
    if (loc.unlockTrigger.startsWith('visited:') && loc.unlockTrigger.includes(nodeId)) {
      await session.unlockNode(loc.id)
      io.to(sessionId).emit('node_unlocked', { nodeId: loc.id })
    }
  }

  const trigger = new TriggerEngine(nodes.characters, nodes.locations)
  const newlyUnlocked = await trigger.evaluate(
    { sessionId, nodeId, text, agentReply: reply, unlockedNodes: state.unlockedNodes },
    session,
  )
  for (const id of newlyUnlocked) {
    io.to(sessionId).emit('node_unlocked', { nodeId: id })
  }
}
