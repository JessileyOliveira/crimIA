import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GroqKeyState {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  hasKey: () => boolean
}

export const useGroqKeyStore = create<GroqKeyState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
      hasKey: () => !!get().apiKey,
    }),
    { name: 'crimia-groq-key' },
  ),
)
