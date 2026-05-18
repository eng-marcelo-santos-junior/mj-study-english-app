import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const TTS_SERVER_URL = process.env.TTS_SERVER_URL
const TTS_INTERNAL_API_KEY = process.env.TTS_INTERNAL_API_KEY

function ttsHeaders(): HeadersInit {
  return TTS_INTERNAL_API_KEY ? { Authorization: `Bearer ${TTS_INTERNAL_API_KEY}` } : {}
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!TTS_SERVER_URL) {
    return NextResponse.json([])
  }

  const locale = request.nextUrl.searchParams.get('locale') ?? ''

  try {
    const url = new URL(`${TTS_SERVER_URL}/voices`)
    if (locale) url.searchParams.set('language', locale)

    const res = await fetch(url.toString(), {
      headers: ttsHeaders(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // Python service returns { voices: [{ name, short_name, locale, gender }] }
    const body = (await res.json()) as { voices?: Record<string, string>[] }
    const raw = body.voices ?? (Array.isArray(body) ? (body as Record<string, string>[]) : [])

    return NextResponse.json(
      raw.map((v) => ({
        shortName: v.short_name ?? v.ShortName,
        friendlyName: v.name ?? v.FriendlyName,
        gender: v.gender ?? v.Gender,
        locale: v.locale ?? v.Locale,
      }))
    )
  } catch {
    return NextResponse.json([])
  }
}
