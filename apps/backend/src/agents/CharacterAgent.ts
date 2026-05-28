import Groq from 'groq-sdk'
import type { CaseCharacter, CaseLocation } from '@crimia/shared-types'

const MODEL = 'llama-3.3-70b-versatile'

type ConversationMessage = { role: 'user' | 'assistant'; content: string }

interface CaseContext {
  characters: Pick<CaseCharacter, 'id' | 'name' | 'role'>[]
  locations: Pick<CaseLocation, 'id' | 'name'>[]
}

function buildSystemPrompt(character: CaseCharacter, ctx: CaseContext): string {
  const otherPeople = ctx.characters
    .filter((c) => c.id !== character.id)
    .map((c) => `- ${c.name}${c.role ? ` (${c.role})` : ''}`)
    .join('\n')

  const places = ctx.locations
    .map((l) => `- ${l.name}`)
    .join('\n')

  return `Você é ${character.name}, ${character.role ?? 'uma pessoa envolvida no caso'}.

PERSONALIDADE: ${character.personality}
O QUE VOCÊ SABE: ${character.knows.join('; ')}
O QUE VOCÊ ESCONDE: ${character.hides.join('; ')}
COMO SE COMPORTAR: Responda de forma natural, coerente com sua personalidade. Suas respostas devem ter entre 2-4 frases.

PESSOAS QUE EXISTEM NESTE CASO (você só pode citar estas):
${otherPeople || '(nenhuma outra pessoa conhecida)'}

LOCAIS QUE EXISTEM NESTE CASO (você só pode citar estes):
${places || '(nenhum local específico)'}

REGRAS ABSOLUTAS:
- Nunca quebre o personagem ou mencione que é uma IA
- Nunca revele diretamente o que esconde, mas você pode dar pistas involuntárias quando pressionado
- Responda em português brasileiro
- Mantenha consistência com o que já disse anteriormente
- Só mencione pessoas e locais das listas acima — NUNCA invente nomes de pessoas ou lugares que não estejam nas listas
- Se quiser se referir a alguém que não está na lista, use termos genéricos como "um conhecido", "alguém da família", sem dar nomes
- Se fingir ser outra pessoa, faça isso como ${character.name} — com suas limitações, percepções e possíveis erros sobre ela
- NUNCA acesse os segredos, motivações reais ou conhecimentos internos de outro personagem ao imitá-lo — você só sabe o que ${character.name} observou ou imagina
- NUNCA descreva o jogador se movendo para outro local ou narre o que acontece em outro cômodo
- Você pode sugerir que o jogador fale com alguém ("talvez Helena saiba mais") mas a voz e os segredos dela são dela`
}

export async function callCharacterAgent(
  character: CaseCharacter,
  history: ConversationMessage[],
  userMessage: string,
  ctx: CaseContext,
  apiKey: string,
): Promise<string> {
  const client = new Groq({ apiKey })

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(character, ctx) },
    ...history.map((m) => ({ role: m.role, content: m.content }) as Groq.Chat.ChatCompletionMessageParam),
    { role: 'user', content: userMessage },
  ]

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    messages,
  })

  return response.choices[0]?.message?.content ?? ''
}
