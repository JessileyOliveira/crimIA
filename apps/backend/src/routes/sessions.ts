import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { GameSession } from '../game/GameSession'
import { evaluateTheory } from '../agents/JudgeAgent'
import { callCompanionAgent } from '../agents/CompanionAgent'
import { inspectElementWithAI, buildClueFromElement } from '../agents/LocationAgent'
import { optionalToken, type AuthRequest } from '../middleware/auth'
import type { CaseData } from '@crimia/shared-types'

const router = Router()

function extractGroqKey(req: AuthRequest): string {
  const raw = req.headers['x-groq-api-key']
  const key = Array.isArray(raw) ? raw[0] : raw
  return key ?? process.env.GROQ_API_KEY ?? ''
}

router.post('/', optionalToken, async (req: AuthRequest, res) => {
  const schema = z.object({ caseId: z.string(), mode: z.enum(['easy', 'normal']) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const sessionId = await GameSession.create(parsed.data.caseId, parsed.data.mode, req.userId)
    return res.status(201).json({ id: sessionId })
  } catch (e) {
    return res.status(404).json({ error: (e as Error).message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const session = new GameSession(req.params.id)
    const state = await session.getState()
    if (!state) return res.status(404).json({ error: 'Sessão não encontrada' })
    return res.json({
      session: state,
      clues: state.clues,
      notebook: state.notebook,
      nodeStatuses: Object.fromEntries(state.unlockedNodes.map((id) => [id, 'unlocked'])),
    })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.patch('/:id/notebook', async (req, res) => {
  const schema = z.object({ notebook: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const session = new GameSession(req.params.id)
    await session.updateNotebook(parsed.data.notebook)
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.post('/:id/inspect', async (req: AuthRequest, res) => {
  const schema = z.object({ nodeId: z.string(), elementId: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const apiKey = extractGroqKey(req)

  try {
    const gameSession = new GameSession(req.params.id)
    const state = await gameSession.getState()
    if (!state) return res.status(404).json({ error: 'Sessão não encontrada' })

    const location = state.locations.find((l) => l.id === parsed.data.nodeId)
    if (!location) return res.status(404).json({ error: 'Local não encontrado' })

    const element = location.elements?.find((e) => e.id === parsed.data.elementId)
    if (!element) return res.status(404).json({ error: 'Elemento não encontrado' })

    const dbCase = await prisma.case.findUnique({ where: { id: state.caseId } })
    const masterDoc = dbCase?.masterDoc as unknown as CaseData['masterDoc']
    const context = `Caso: ${state.caseTitle}. Suspeito: ${masterDoc?.suspect}. Local do crime: ${masterDoc?.location}.`

    let description: string
    try {
      description = await inspectElementWithAI(location, element, context, apiKey)
    } catch (e) {
      console.error('[LocationAgent error]', (e as Error).message)
      description = element.description ?? `Você examina ${element.label} com atenção.`
    }

    const clue = buildClueFromElement(element, location)
    if (clue) await gameSession.addClue(clue)

    return res.json({ description, clue })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.post('/:id/submit', async (req: AuthRequest, res) => {
  const schema = z.object({ theory: z.string().min(10) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const apiKey = extractGroqKey(req)

  try {
    const gameSession = new GameSession(req.params.id)
    const state = await gameSession.getState()
    if (!state) return res.status(404).json({ error: 'Sessão não encontrada' })

    const dbCase = await prisma.case.findUnique({ where: { id: state.caseId } })
    if (!dbCase) return res.status(404).json({ error: 'Caso não encontrado' })

    const masterDoc = dbCase.masterDoc as unknown as CaseData['masterDoc']
    const score = await evaluateTheory(masterDoc, parsed.data.theory, apiKey)

    await prisma.session.update({
      where: { id: req.params.id },
      data: { finalTheory: parsed.data.theory, score: score.total },
    })

    await gameSession.saveScore(score)

    return res.json({ ok: true, score })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.get('/:id/result', async (req, res) => {
  try {
    const gameSession = new GameSession(req.params.id)
    const score = await gameSession.getScore()
    if (!score) return res.status(404).json({ error: 'Resultado não encontrado. A sessão pode ter expirado.' })

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      select: { finalTheory: true },
    })

    return res.json({ ...score as object, finalTheory: session?.finalTheory ?? null })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.get('/:id/chat/:nodeId', async (req, res) => {
  try {
    const session = new GameSession(req.params.id)
    const history = await session.getDisplayHistory(req.params.nodeId)
    return res.json(history)
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.post('/:id/companion', async (req: AuthRequest, res) => {
  const schema = z.object({ message: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const apiKey = extractGroqKey(req)

  try {
    const session = new GameSession(req.params.id)
    const state = await session.getState()
    if (!state || state.mode !== 'easy') return res.status(403).json({ error: 'Modo fácil não ativo' })

    const reply = await callCompanionAgent(state, parsed.data.message, apiKey)
    return res.json({ reply })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

export default router
