import { Router } from 'express'
import { prisma } from '../db/prisma'

const router = Router()

router.get('/', async (_req, res) => {
  const cases = await prisma.case.findMany({
    select: { id: true, title: true, difficulty: true, description: true },
  })
  res.json(cases)
})

router.get('/:id', async (req, res) => {
  const c = await prisma.case.findUnique({ where: { id: req.params.id } })
  if (!c) return res.status(404).json({ error: 'Caso não encontrado' })
  const { masterDoc: _masterDoc, ...safeCase } = c
  return res.json(safeCase)
})

export default router
