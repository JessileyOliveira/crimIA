import type { CaseData } from '@crimia/shared-types'
import { GameSession } from './GameSession'

type TriggerContext = {
  sessionId: string
  nodeId: string
  text: string
  agentReply: string
  unlockedNodes: string[]
}

export class TriggerEngine {
  constructor(
    private characters: CaseData['nodes']['characters'],
    private locations: CaseData['nodes']['locations'] = [],
  ) {}

  async evaluate(ctx: TriggerContext, session: GameSession): Promise<string[]> {
    const newlyUnlocked: string[] = []
    const combined = `${ctx.text} ${ctx.agentReply}`.toLowerCase()

    for (const char of this.characters) {
      if (ctx.unlockedNodes.includes(char.id)) continue
      const unlockedByTrigger =
        char.unlockTrigger && this.matchesTrigger(char.unlockTrigger, ctx)
      const unlockedByMention = this.isMentioned(char.name, combined)
      if (unlockedByTrigger || unlockedByMention) {
        await session.unlockNode(char.id)
        newlyUnlocked.push(char.id)
      }
    }

    for (const loc of this.locations) {
      if (ctx.unlockedNodes.includes(loc.id)) continue
      if (loc.unlockTrigger?.startsWith('visited:')) continue // tratado em handleLocationMessage
      const unlockedByTrigger =
        loc.unlockTrigger && this.matchesTrigger(loc.unlockTrigger, ctx)
      const unlockedByMention = this.isMentioned(loc.name, combined)
      if (unlockedByTrigger || unlockedByMention) {
        await session.unlockNode(loc.id)
        newlyUnlocked.push(loc.id)
      }
    }

    return newlyUnlocked
  }

  private isMentioned(name: string, combined: string): boolean {
    // split "Dr. Emil Voss" into ["Dr", "Emil", "Voss"] and check any word ≥ 4 chars
    return name
      .split(/\s+/)
      .filter((w) => w.replace(/\W/g, '').length >= 4)
      .some((w) => combined.includes(w.replace(/\W/g, '').toLowerCase()))
  }

  private matchesTrigger(trigger: string, ctx: TriggerContext): boolean {
    const parts = trigger.split('+').map((p) => p.trim())

    return parts.every((part) => {
      if (part.startsWith('talked_to:')) {
        const targetId = part.replace('talked_to:', '')
        return ctx.unlockedNodes.includes(targetId) && ctx.nodeId === targetId
      }
      if (part.startsWith('keyword:')) {
        const keyword = part.replace('keyword:', '').toLowerCase()
        return (
          ctx.text.toLowerCase().includes(keyword) ||
          ctx.agentReply.toLowerCase().includes(keyword)
        )
      }
      if (part.startsWith('visited:')) {
        const locationId = part.replace('visited:', '')
        return ctx.unlockedNodes.includes(locationId)
      }
      return false
    })
  }
}
