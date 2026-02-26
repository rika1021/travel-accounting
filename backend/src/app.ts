import { Hono } from 'hono'
import { tripsRoute } from './routes/trips'
import { cors } from 'hono/cors'

export const app = new Hono()

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }))

// Mount trips routes (keeps /api/trips as-is)

app.use(
  '*',
  cors({
    origin: '*', // 先開放全部，之後可限制成 Vercel domain
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)
app.route('', tripsRoute)


