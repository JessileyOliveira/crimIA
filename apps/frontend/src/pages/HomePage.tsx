import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-noir-950 relative overflow-hidden">
      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="relative z-10 text-center max-w-2xl px-6 animate-fade-in">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-noir-800 border border-crimson-600 mb-6">
            <svg className="w-10 h-10 text-crimson-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="font-serif text-6xl font-bold text-white tracking-tight">
            Crim<span className="text-crimson-500">IA</span>
          </h1>
          <p className="mt-3 text-slate-400 font-mono text-sm tracking-widest uppercase">
            Sistema de Investigação Criminal
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-crimson-600/50" />
          <span className="text-crimson-600 text-xs font-mono">◆</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-crimson-600/50" />
        </div>

        {/* Description */}
        <p className="text-slate-300 text-lg leading-relaxed mb-10 font-serif italic">
          "Cada testemunha tem um segredo. Cada local esconde uma pista.
          <br />A verdade está nas sombras — cabe a você encontrá-la."
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10 text-left">
          {[
            { icon: '🎭', label: 'Personagens IA', desc: 'Agentes independentes com personalidade' },
            { icon: '🗺️', label: 'Mapa Dinâmico', desc: 'Descubra locais e suspeitos progressivamente' },
            { icon: '⚖️', label: 'Avaliação Final', desc: 'Score por dimensão do crime' },
          ].map((f) => (
            <div key={f.label} className="card text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-xs font-mono text-amber-400 mb-1">{f.label}</div>
              <div className="text-xs text-slate-400">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isAuthenticated() ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => navigate('/cases')}
              className="btn-primary text-base px-10 py-3 rounded-lg uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Iniciar Investigação
            </button>
            <p className="text-slate-500 text-xs font-mono">
              Conectado como <span className="text-slate-300">{user?.name}</span>
            </p>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-3 rounded-lg uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-8 py-3 rounded-lg uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Criar Conta
            </button>
          </div>
        )}

        <p className="mt-6 text-slate-500 text-xs font-mono">
          Powered by Groq AI • Multi-Agent System
        </p>
      </div>
    </div>
  )
}
