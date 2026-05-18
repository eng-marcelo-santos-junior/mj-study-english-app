import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const TTS_SERVER_URL = process.env.TTS_SERVER_URL

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
    if (locale) url.searchParams.set('locale', locale)

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const voices = (await res.json()) as Record<string, string>[]
    return NextResponse.json(
      voices.map((v) => ({
        shortName: v.ShortName,
        friendlyName: v.FriendlyName,
        gender: v.Gender,
        locale: v.Locale,
      }))
    )
  } catch {
    return NextResponse.json([])
  }
}
