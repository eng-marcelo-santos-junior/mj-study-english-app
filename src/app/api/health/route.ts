import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const url = process.env.DATABASE_URL ?? 'NOT SET'
  const sanitized = url.replace(/:([^:@]+)@/, ':***@')

  try {
    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })
    const result = await pool.query('SELECT NOW() as time')
    await pool.end()
    return NextResponse.json({ ok: true, time: result.rows[0].time, url: sanitized })
  } catch (err) {
    const error = err as Error
    return NextResponse.json({ ok: false, error: error.message, url: sanitized }, { status: 500 })
  }
}
