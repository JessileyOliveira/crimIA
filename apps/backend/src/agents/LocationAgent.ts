import Groq from 'groq-sdk'
import type { CaseLocation, CaseCharacter, Clue, SceneElement } from '@crimia/shared-types'

const MODEL = 'llama-3.3-70b-versatile'

type ConversationMessage = { role: 'user' | 'assistant'; content: string }

interface CaseContext {
  characters: Pick<CaseCharacter, 'id' | 'name' | 'role'>[]
  locations: Pick<CaseLocation, 'id' | 'name'>[]
}

function buildLocationSystemPrompt(location: CaseLocation, ctx: CaseContext): string {
  const elements = (location.elements ?? [])
    .map((e) => `- "${e.label}": ${e.clueDescription ?? e.description ?? 'objeto presente no local'}`)
    .join('\n')

  const people = ctx.characters
    .map((c) => `- ${c.name}${c.role ? ` (${c.role})` : ''}`)
    .join('\n')

  const places = ctx.locations
    .map((l) => `- ${l.name}`)
    .join('\n')

  return `Você é o narrador de uma cena de crime em um jogo investigativo.
O jogador é um detetive investigando o local.

LOCAL: ${location.name}
DESCRIÇÃO: ${location.description ?? ''}

OBJETOS PRESENTES NESTE LOCAL (não liste todos de uma vez — revele apenas quando o jogador perguntar ou examinar):
${elements}

PESSOAS QUE EXISTEM NESTE CASO (só cite estas):
${people || '(nenhuma)'}

LOCAIS QUE EXISTEM NESTE CASO (só cite estes):
${places || '(nenhum)'}

REGRAS:
- Responda em 2-4 frases, em português brasileiro
- Fale em segunda pessoa: "Você nota...", "Ao examinar...", "Suas mãos encontram..."
- Seja atmosférico e suspenseful, como um livro de mistério noir
- Quando o jogador mencionar ou examinar um objeto, descreva-o com detalhes
- Se o objeto contiver uma pista, incorpore a descoberta na descrição de forma natural
- Nunca quebre a narrativa mencionando que é uma IA
- NUNCA invente nomes de pessoas ou locais que não estejam nas listas acima
- NUNCA narre o jogador se movendo para outro local ou descreva o que acontece em outro cômodo
- NUNCA simule o que uma pessoa diria ou fale como se fosse um personagem — você é a descrição do ambiente, não um ator
- Você pode mencionar que algo "leva à copa" ou que "Carlos costumava passar por aqui", mas nunca saia deste espaço`
}

export async function callLocationAgent(
  location: CaseLocation,
  history: ConversationMessage[],
  userMessage: string,
  ctx: CaseContext,
  apiKey: string,
): Promise<string> {
  const client = new Groq({ apiKey })

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildLocationSystemPrompt(location, ctx) },
    ...history.map((m) => ({ role: m.role, content: m.content }) as Groq.Chat.ChatCompletionMessageParam),
    { role: 'user', content: userMessage },
  ]

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages,
  })

  return response.choices[0]?.message?.content ?? ''
}

export async function inspectElementWithAI(
  location: CaseLocation,
  element: SceneElement,
  context: string,
  apiKey: string,
): Promise<string> {
  const client = new Groq({ apiKey })

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: `Você é o narrador de uma cena de crime. Descreva o que o detetive encontra ao examinar um objeto específico. Seja atmosférico, em 2-3 frases, em português brasileiro. Contexto: ${context}`,
      },
      {
        role: 'user',
        content: `O detetive examina: ${element.label}. ${element.description ?? ''}`,
      },
    ],
  })

  return response.choices[0]?.message?.content ?? element.description ?? `Você examina ${element.label} com atenção.`
}

export function detectTriggeredClues(
  userMessage: string,
  agentReply: string,
  location: CaseLocation,
  alreadyCollected: Set<string>,
): Clue[] {
  const combined = (userMessage + ' ' + agentReply).toLowerCase()
  const triggered: Clue[] = []

  for (const element of location.elements ?? []) {
    if (!element.clue || !element.clueId) continue
    if (alreadyCollected.has(element.clueId)) continue

    const keywords = element.label.toLowerCase().split(/\s+/)
    const mentioned = keywords.some((kw) => kw.length > 3 && combined.includes(kw))
    if (mentioned) {
      triggered.push(buildClueFromElement(element, location)!)
    }
  }

  return triggered
}

export function buildClueFromElement(element: SceneElement, location: CaseLocation): Clue | null {
  if (!element.clue || !element.clueId) return null
  return {
    id: element.clueId,
    title: element.label,
    description: element.clueDescription ?? `Encontrado em: ${location.name}`,
    location: location.name,
    elementId: element.id,
  }
}
