import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { synthesize } from '@/lib/tts/edge-tts-client'
import { cleanHtmlText, calculateTextHash } from '@/lib/tts/text-utils'
import { z } from 'zod'

const schema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  voice: z.string().min(1, 'Voice must be specified'),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const messages = Object.values(parsed.error.flatten().fieldErrors).flat()
    return NextResponse.json({ error: messages[0] ?? 'Invalid input' }, { status: 400 })
  }

  const { content, voice } = parsed.data
  const text = cleanHtmlText(content)

  if (!text) {
    return NextResponse.json({ error: 'Digite um texto antes de gerar o áudio.' }, { status: 400 })
  }

  try {
    const audioBuffer = await synthesize(text, voice)
    const base64 = audioBuffer.toString('base64')
    const textHash = calculateTextHash(text)
    return NextResponse.json({
      audioDataUrl: `data:audio/mp3;base64,${base64}`,
      textHash,
      text,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS generation failed'
    return NextResponse.json(
      { error: `Não foi possível gerar o áudio. ${message}` },
      { status: 502 }
    )
  }
}
