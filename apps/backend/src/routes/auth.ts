import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma'
import { signToken, verifyToken, type AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/register', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(6),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' })

    const hashed = await bcrypt.hash(parsed.data.password, 10)
    const user = await prisma.user.create({
      data: { email: parsed.data.email, name: parsed.data.name, password: hashed },
    })

    const token = signToken(user.id)
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.post('/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(parsed.data.password, user.password)
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })

    const token = signToken(user.id)
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.get('/me', verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json(user)
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

router.get('/history', verifyToken, async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      include: { case: { select: { id: true, title: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(sessions.map((s) => ({
      sessionId: s.id,
      caseId: s.caseId,
      caseTitle: s.case.title,
      difficulty: s.case.difficulty,
      score: s.score,
      finished: s.finalTheory !== null,
      createdAt: s.createdAt,
    })))
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

export default router
