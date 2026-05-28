import 'dotenv/config'

// Bypass certificados auto-assinados em ambientes com proxy corporativo (dev only)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

import { createServer } from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import casesRouter from './routes/cases'
import sessionsRouter from './routes/sessions'
import authRouter from './routes/auth'
import { registerSocketHandlers } from './sockets/handlers'
import { syncCasesToDB } from './game/CaseLoader'

const isProd = process.env.NODE_ENV === 'production'

const app = express()
const httpServer = createServer(app)

const corsOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const io = new Server(httpServer, {
  cors: { origin: isProd ? false : corsOrigin, credentials: true },
})

if (!isProd) {
  app.use(cors({ origin: corsOrigin, credentials: true }))
}

app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/cases', casesRouter)
app.use('/api/sessions', sessionsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

registerSocketHandlers(io)

// Em produção, serve o build do frontend como arquivos estáticos
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// Evita crash por promises rejeitadas não tratadas
process.on('unhandledRejection', (reason) => {
  console.error('[CrimIA] UnhandledRejection:', reason)
})

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, async () => {
  console.log(`[CrimIA] Backend rodando na porta ${PORT} (${isProd ? 'produção' : 'desenvolvimento'})`)
  await syncCasesToDB()
})

export { io }
