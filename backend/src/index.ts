import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

const server = serve(
  {
    fetch: app.fetch.bind(app),
    port,
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
  }
)

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received, closing server...`)
  server.close?.()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))