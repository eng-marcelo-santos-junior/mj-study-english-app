import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchVoices } from '@/lib/tts/edge-tts-client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locale = request.nextUrl.searchParams.get('locale')

  try {
    const voices = await fetchVoices()
    const filtered = locale ? voices.filter((v) => v.Locale.startsWith(locale)) : voices
    const result = filtered.map((v) => ({
      shortName: v.ShortName,
      friendlyName: v.FriendlyName,
      gender: v.Gender,
      locale: v.Locale,
    }))
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch voices'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
