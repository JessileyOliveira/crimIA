import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { useGroqKeyStore } from '../store/groqKeyStore'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().token
  const groqApiKey = useGroqKeyStore.getState().apiKey
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (groqApiKey) headers['X-Groq-Api-Key'] = groqApiKey

  const res = await fetch(path, { ...init, headers })

  if (res.status === 401) {
    toast.error('Sessão expirada. Faça login novamente.')
    useAuthStore.getState().logout()
  }

  return res
}
