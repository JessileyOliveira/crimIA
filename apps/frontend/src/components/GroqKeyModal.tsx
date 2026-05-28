import { useState } from 'react'
import { useGroqKeyStore } from '../store/groqKeyStore'

const STEPS = [
  {
    number: 1,
    text: 'Acesse',
    link: { label: 'console.groq.com', href: 'https://console.groq.com' },
    suffix: 'e crie uma conta gratuita (ou faça login)',
  },
  {
    number: 2,
    text: 'No menu lateral, clique em',
    highlight: 'API Keys',
    suffix: null,
    link: null,
  },
  {
    number: 3,
    text: 'Clique em',
    highlight: 'Create API Key',
    suffix: ', dê um nome (ex: "CrimIA") e confirme',
    link: null,
  },
  {
    number: 4,
    text: 'Copie a chave gerada (começa com',
    highlight: 'gsk_',
    suffix: ') e cole abaixo',
    link: null,
  },
]

export default function GroqKeyModal() {
  const { setApiKey } = useGroqKeyStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [showSteps, setShowSteps] = useState(false)

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed.startsWith('gsk_')) {
      setError('A chave deve começar com "gsk_"')
      return
    }
    if (trimmed.length < 20) {
      setError('Chave inválida — muito curta')
      return
    }
    setApiKey(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-noir-900 border border-noir-700 rounded-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="font-serif text-2xl text-amber-300 mb-2">Chave de API Groq</h2>
          <p className="text-noir-400 text-sm leading-relaxed">
            CrimIA usa a IA Groq para dar vida aos personagens. Sua chave é armazenada
            apenas <span className="text-amber-400">localmente no seu navegador</span> — nunca enviada para nossos servidores.
          </p>
        </div>

        {/* Step-by-step toggle */}
        <div className="px-8 pb-4">
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            <span className={`transition-transform duration-200 ${showSteps ? 'rotate-90' : ''}`}>▶</span>
            {showSteps ? 'Ocultar instruções' : 'Como gerar minha chave Groq?'}
          </button>

          {showSteps && (
            <div className="mt-3 bg-noir-800/60 border border-noir-700 rounded-lg p-4 space-y-3">
              {STEPS.map((step) => (
                <div key={step.number} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs flex items-center justify-center font-mono">
                    {step.number}
                  </span>
                  <p className="text-xs text-noir-300 leading-relaxed">
                    {step.text}{' '}
                    {step.link && (
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 underline"
                      >
                        {step.link.label}
                      </a>
                    )}
                    {step.highlight && (
                      <span className="font-mono text-amber-300 bg-amber-500/10 px-1 rounded">
                        {step.highlight}
                      </span>
                    )}
                    {step.suffix && <>{' '}{step.suffix}</>}
                  </p>
                </div>
              ))}

              <div className="pt-1 border-t border-noir-700">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <span>↗</span>
                  Ir direto para a página de API Keys
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-8 pb-2">
          <label className="block text-xs text-noir-400 uppercase tracking-wider mb-2">
            Groq API Key
          </label>
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="gsk_..."
            autoFocus
            className="w-full bg-noir-800 border border-noir-600 rounded px-4 py-3 text-sm font-mono text-amber-100 placeholder-noir-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4">
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-noir-950 font-bold py-3 rounded transition-colors text-sm uppercase tracking-wider"
          >
            Salvar e Continuar
          </button>
          <p className="text-center text-xs text-noir-600 mt-3">
            A chave é gratuita e não exige cartão de crédito
          </p>
        </div>

      </div>
    </div>
  )
}
