import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { prisma } from '../db/prisma'
import type { CaseData } from '@crimia/shared-types'

const CASES_DIR = join(__dirname, '../../cases')

export async function syncCasesToDB(): Promise<void> {
  let files: string[]
  try {
    files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'))
  } catch {
    console.warn('[CaseLoader] Pasta /cases não encontrada, pulando sync')
    return
  }

  for (const file of files) {
    const raw = readFileSync(join(CASES_DIR, file), 'utf-8')
    const data: CaseData = JSON.parse(raw)

    await prisma.case.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        difficulty: data.difficulty,
        description: data.description ?? '',
        masterDoc: data.masterDoc as object,
        nodes: data.nodes as object,
      },
      create: {
        id: data.id,
        title: data.title,
        difficulty: data.difficulty,
        description: data.description ?? '',
        masterDoc: data.masterDoc as object,
        nodes: data.nodes as object,
      },
    })

    console.log(`[CaseLoader] Sincronizado: ${data.title}`)
  }
}
