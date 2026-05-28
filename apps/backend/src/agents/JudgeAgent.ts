import Groq from 'groq-sdk'
import type { MasterDoc, FinalScore } from '@crimia/shared-types'

const MODEL = 'llama-3.3-70b-versatile'

function buildPrompt(masterDoc: MasterDoc, playerTheory: string) {
  return `SOLUÇÃO REAL DO CASO:
Suspeito: ${masterDoc.suspect}
Motivo: ${masterDoc.motive}
Método: ${masterDoc.method}
Local: ${masterDoc.location}
Horário: ${masterDoc.time}
Detalhes: ${masterDoc.details ?? 'N/A'}

TEORIA DO JOGADOR:
${playerTheory}

Avalie cada dimensão de 0 a 100 e retorne SOMENTE este JSON, sem texto antes ou depois:
{"dimensions":{"suspect":{"score":0,"feedback":""},"motive":{"score":0,"feedback":""},"method":{"score":0,"feedback":""},"location":{"score":0,"feedback":""},"time":{"score":0,"feedback":""}},"total":0,"narrative":""}`
}

function parseScore(text: string): FinalScore {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Resposta sem JSON válido: ${text.slice(0, 200)}`)

  const parsed = JSON.parse(jsonMatch[0]) as FinalScore
  if (!parsed.dimensions || typeof parsed.total !== 'number') {
    throw new Error('JSON não contém campos obrigatórios (dimensions, total)')
  }
  return parsed
}

export async function evaluateTheory(
  masterDoc: MasterDoc,
  playerTheory: string,
  apiKey: string,
): Promise<FinalScore> {
  const client = new Groq({ apiKey })
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1200,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Você é um juiz avaliando a teoria de um detetive. Retorne APENAS JSON válido, sem markdown, sem texto adicional.',
          },
          {
            role: 'user',
            content: buildPrompt(masterDoc, playerTheory),
          },
        ],
      })

      const text = response.choices[0]?.message?.content ?? ''
      return parseScore(text)
    } catch (e) {
      lastError = e as Error
      console.error(`[JudgeAgent] tentativa ${attempt} falhou:`, lastError.message)
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  throw lastError ?? new Error('JudgeAgent falhou após 3 tentativas')
}
