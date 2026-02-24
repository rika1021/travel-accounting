import { Hono } from 'hono'
import { tripsRoute } from './routes/trips'

export const app = new Hono()

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }))

// Mount trips routes (keeps /api/trips as-is)
app.route('', tripsRoute)
