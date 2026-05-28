import Groq from 'groq-sdk'
import type { GameSessionState } from '@crimia/shared-types'

const MODEL = 'llama-3.1-8b-instant'

export async function callCompanionAgent(
  state: GameSessionState,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const client = new Groq({ apiKey })

  const cluesSummary = state.clues.length > 0
    ? state.clues.map((c) => `- ${c.title}: ${c.description}`).join('\n')
    : 'Nenhuma pista coletada ainda'

  const unlockedChars = state.characters
    .filter((c) => state.unlockedNodes.includes(c.id))
    .map((c) => c.name)
    .join(', ')

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `Você é o parceiro detetive do jogador. Você tem acesso ao estado atual da investigação e deve ajudar com sugestões sutis sem revelar a solução diretamente.
Seja encorajador, perspicaz e use o que já foi descoberto para guiar o jogador.
Responda em português brasileiro, em 2-3 frases no máximo.

ESTADO ATUAL DA INVESTIGAÇÃO:
Pistas coletadas:
${cluesSummary}

Personagens desbloqueados: ${unlockedChars || 'Nenhum ainda'}
Anotações do jogador: ${state.notebook || '(sem anotações)'}`,
      },
      { role: 'user', content: userMessage },
    ],
  })

  return response.choices[0]?.message?.content ?? ''
}
