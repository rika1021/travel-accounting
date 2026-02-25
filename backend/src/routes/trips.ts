import { Hono } from 'hono'
import { pool } from '../db'

type CreateTripBody = {
  title?: unknown
  startDate?: unknown
  endDate?: unknown
  baseCurrency?: unknown
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isISODateString(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false

  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])

  // Basic range checks
  if (mo < 1 || mo > 12) return false
  if (d < 1 || d > 31) return false

  // Strict date validity check (no auto-rollover)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  )
}




function dateLE(a: string, b: string): boolean {
  return a <= b // lexicographic works for YYYY-MM-DD
}

function toYMD(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    // 其他可解析字串（保守處理）
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return value
  }

  return String(value ?? '')
}

export const tripsRoute = new Hono()

tripsRoute.post('/api/trips', async (c) => {
  try {
    const body = (await c.req.json()) as CreateTripBody
    const { title, startDate, endDate, baseCurrency } = body

    if (!isNonEmptyString(title)) {
      return c.json({ message: 'title is required' }, 400)
    }
    if (!isISODateString(startDate)) {
      return c.json({ message: 'startDate must be YYYY-MM-DD' }, 400)
    }
    if (!isISODateString(endDate)) {
      return c.json({ message: 'endDate must be YYYY-MM-DD' }, 400)
    }
    if (!isNonEmptyString(baseCurrency)) {
      return c.json({ message: 'baseCurrency is required' }, 400)
    }
    if (!dateLE(startDate, endDate)) {
      return c.json({ message: 'startDate must be <= endDate' }, 400)
    }

    const sql = `
      INSERT INTO trips (title, start_date, end_date, base_currency)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, start_date, end_date, base_currency, created_at
    `
    const params = [title.trim(), startDate, endDate, baseCurrency.trim()]

    const result = await pool.query(sql, params)
    const row = result.rows[0]

    return c.json(
      {
        id: String(row.id),
        title: String(row.title),
        startDate: toYMD(row.start_date),
        endDate: toYMD(row.end_date),
        baseCurrency: String(row.base_currency),
        createdAt: new Date(row.created_at).toISOString(),
      },
      201
    )
  } catch (err: any) {
    const msg =
      typeof err?.message === 'string' ? err.message : 'Internal Server Error'
    return c.json({ message: msg }, 500)
  }
})


// (keep only one GET /api/trips below)

// GET /api/trips - 取得所有 trip，依 created_at DESC 排序
tripsRoute.get('/api/trips', async (c) => {
  try {
    const sql = `
      SELECT id, title, start_date, end_date, base_currency, created_at
      FROM trips
      ORDER BY created_at DESC
    `
    const result = await pool.query(sql)
    const trips = result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      startDate: toYMD(row.start_date),
      endDate: toYMD(row.end_date),
      baseCurrency: String(row.base_currency),
      createdAt: new Date(row.created_at).toISOString(),
    }))
    return c.json(trips, 200)
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'Internal Server Error'
    return c.json({ message: msg }, 500)
  }
})

tripsRoute.get('/api/trips/:tripId', async (c) => {
  try {
    const tripId = c.req.param('tripId')

    // 1️⃣ 查 trip
    const tripResult = await pool.query(
      `SELECT id, title, start_date, end_date, base_currency, created_at
       FROM trips
       WHERE id = $1`,
      [tripId]
    )

    if (tripResult.rowCount === 0) {
      return c.json({ message: 'Trip not found' }, 404)
    }

    const tripRow = tripResult.rows[0]

    // 2️⃣ 查 expenses
    const expenseResult = await pool.query(
      `SELECT id, trip_id, amount, currency, category, spent_at, payer, note, created_at
       FROM expenses
       WHERE trip_id = $1
       ORDER BY spent_at ASC`,
      [tripId]
    )

    const expenses = expenseResult.rows.map((row) => ({
      id: String(row.id),
      tripId: String(row.trip_id),
      amount: Number(row.amount),
      currency: String(row.currency),
      category: String(row.category),
      spentAt: toYMD(row.spent_at),
      payer: String(row.payer),
      note: row.note ?? null,
      createdAt: new Date(row.created_at).toISOString(),
    }))

    // 3️⃣ JS 計算 stats
    const totalByCurrency: Record<string, number> = {}
    const totalByCategory: Record<string, number> = {}
    const totalByDay: Record<string, number> = {}

    for (const e of expenses) {
      totalByCurrency[e.currency] =
        (totalByCurrency[e.currency] || 0) + e.amount

      totalByCategory[e.category] =
        (totalByCategory[e.category] || 0) + e.amount

      totalByDay[e.spentAt] =
        (totalByDay[e.spentAt] || 0) + e.amount
    }

    return c.json({
      trip: {
        id: String(tripRow.id),
        title: String(tripRow.title),
        startDate: toYMD(tripRow.start_date),
        endDate: toYMD(tripRow.end_date),
        baseCurrency: String(tripRow.base_currency),
        createdAt: new Date(tripRow.created_at).toISOString(),
      },
      expenses,
      stats: {
        totalByCurrency,
        totalByCategory,
        totalByDay,
      },
    })
  } catch (err: any) {
    const msg =
      typeof err?.message === 'string'
        ? err.message
        : 'Internal Server Error'
    return c.json({ message: msg }, 500)
  }
})

type CreateExpenseBody = {
  amount?: unknown
  currency?: unknown
  category?: unknown
  spentAt?: unknown
  payer?: unknown
  note?: unknown
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

tripsRoute.post('/api/trips/:tripId/expenses', async (c) => {
  try {
    const tripId = c.req.param('tripId')
    const body = (await c.req.json()) as CreateExpenseBody
    const { amount, currency, category, spentAt, payer, note } = body

    // 0) 先確認 trip 存在（契約未明講，但避免插入 orphan expense）
    const tripResult = await pool.query(`SELECT id FROM trips WHERE id = $1`, [
      tripId,
    ])
    if (tripResult.rowCount === 0) {
      return c.json({ message: 'Trip not found' }, 404)
    }

    // 1) Validate
    if (!isNumber(amount)) {
      return c.json({ message: 'amount must be a number' }, 400)
    }
    if (!isNonEmptyString(currency)) {
      return c.json({ message: 'currency is required' }, 400)
    }
    if (!isNonEmptyString(category)) {
      return c.json({ message: 'category is required' }, 400)
    }
    if (!isISODateString(spentAt)) {
      return c.json({ message: 'spentAt must be YYYY-MM-DD' }, 400)
    }
    if (!isNonEmptyString(payer)) {
      return c.json({ message: 'payer is required' }, 400)
    }
    if (!(note === null || note === undefined || typeof note === 'string')) {
      return c.json({ message: 'note must be a string or null' }, 400)
    }

    // 2) Insert expense
    const sql = `
      INSERT INTO expenses (trip_id, amount, currency, category, spent_at, payer, note)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, trip_id, amount, currency, category, spent_at, payer, note, created_at
    `
    const params = [
      tripId,
      amount,
      currency.trim(),
      category.trim(),
      spentAt,
      payer.trim(),
      note === undefined ? null : note,
    ]

    const result = await pool.query(sql, params)
    const row = result.rows[0]

    // 3) Response (camelCase)
    return c.json(
      {
        id: String(row.id),
        tripId: String(row.trip_id),
        amount: Number(row.amount),
        currency: String(row.currency),
        category: String(row.category),
        spentAt: toYMD(row.spent_at),
        payer: String(row.payer),
        note: row.note === null || row.note === undefined ? null : String(row.note),
        createdAt: new Date(row.created_at).toISOString(),
      },
      201
    )
  } catch (err: any) {
    const msg =
      typeof err?.message === 'string' ? err.message : 'Internal Server Error'
    return c.json({ message: msg }, 500)
  }
})

