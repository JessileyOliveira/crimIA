import { useGameStore } from '../../store/gameStore'

type NodeType = 'character' | 'location'

interface MapNode {
  id: string
  name: string
  type: NodeType
  unlocked: boolean
  role?: string
}

export default function CaseMap() {
  const { session, nodeStatuses, setActiveView, activeView, clues } = useGameStore()

  if (!session) return null

  const nodes: MapNode[] = [
    ...(session.characters ?? []).map((c) => ({ ...c, type: 'character' as NodeType })),
    ...(session.locations ?? []).map((l) => ({ ...l, type: 'location' as NodeType })),
  ]

  const isUnlocked = (node: MapNode) =>
    node.unlocked ||
    session.unlockedNodes.includes(node.id) ||
    nodeStatuses[node.id] === 'unlocked'

  const isActive = (nodeId: string) =>
    activeView.type !== 'none' && activeView.type !== 'notebook' && activeView.nodeId === nodeId

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-noir-700">
        <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest">Mapa do Caso</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Characters section */}
        <div className="mb-3">
          <p className="text-xs font-mono text-slate-500 uppercase px-2 mb-2">Personagens</p>
          {nodes.filter((n) => n.type === 'character' && isUnlocked(n)).map((node) => (
            <button
              key={node.id}
              onClick={() => setActiveView({ type: 'chat', nodeId: node.id })}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors text-sm ${
                isActive(node.id)
                  ? 'bg-crimson-600/20 border border-crimson-600/50 text-white'
                  : 'hover:bg-noir-700 text-slate-300'
              }`}
            >
              <span className="text-lg">🎭</span>
              <div>
                <div className="font-mono text-xs">{node.name}</div>
                {node.role && <div className="text-xs text-slate-400">{node.role}</div>}
              </div>
            </button>
          ))}
        </div>

        {/* Locations section */}
        <div>
          <p className="text-xs font-mono text-slate-500 uppercase px-2 mb-2">Locais</p>
          {nodes.filter((n) => n.type === 'location' && isUnlocked(n)).map((node) => (
            <button
              key={node.id}
              onClick={() => setActiveView({ type: 'scene', nodeId: node.id })}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors text-sm ${
                isActive(node.id)
                  ? 'bg-amber-400/20 border border-amber-400/50 text-white'
                  : 'hover:bg-noir-700 text-slate-300'
              }`}
            >
              <span className="text-lg">📍</span>
              <div className="font-mono text-xs">{node.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Clues counter */}
      <div className="px-4 py-3 border-t border-noir-700">
        <button
          onClick={() => setActiveView({ type: 'notebook' })}
          className="w-full flex items-center justify-between text-xs font-mono hover:text-white transition-colors text-slate-400"
        >
          <span>📓 Caderno</span>
          <span className="badge border border-amber-400/30 bg-amber-400/10 text-amber-400">
            {clues.length} pistas
          </span>
        </button>
      </div>
    </div>
  )
}
