import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cleanHtmlText, calculateTextHash } from '@/lib/tts/text-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  side: z.enum(['front', 'back']),
  language: z.string().min(1),
  voice: z.string().optional(),
  rate: z.string().optional(),
  pitch: z.string().optional(),
})

const TTS_SERVER_URL = process.env.TTS_SERVER_URL
const TTS_INTERNAL_API_KEY = process.env.TTS_INTERNAL_API_KEY

function ttsHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(TTS_INTERNAL_API_KEY ? { Authorization: `Bearer ${TTS_INTERNAL_API_KEY}` } : {}),
  }
}

type Params = { params: Promise<{ flashcardId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { flashcardId } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { side, language, voice, rate = '+0%', pitch = '+0Hz' } = parsed.data
  const userId = session.user.id

  const flashcard = await prisma.flashcard.findFirst({
    where: { id: flashcardId, deck: { userId } },
    select: { id: true, frontContent: true, backContent: true },
  })
  if (!flashcard) {
    return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
  }

  const rawContent = side === 'front' ? flashcard.frontContent : flashcard.backContent
  const text = cleanHtmlText(rawContent)

  if (!text) {
    return NextResponse.json(
      { error: 'Card content is empty — cannot generate audio.' },
      { status: 400 }
    )
  }

  if (!TTS_SERVER_URL) {
    return NextResponse.json(
      { error: 'TTS service is not configured on this server.' },
      { status: 503 }
    )
  }

  if (!voice) {
    return NextResponse.json({ error: 'Voice must be specified.' }, { status: 400 })
  }

  try {
    const ttsRes = await fetch(`${TTS_SERVER_URL}/tts/generate`, {
      method: 'POST',
      headers: ttsHeaders(),
      body: JSON.stringify({
        card_id: flashcardId,
        user_id: userId,
        side,
        text,
        language,
        voice,
        rate,
        pitch,
      }),
    })

    if (!ttsRes.ok) {
      const err = await ttsRes.json().catch(() => ({ detail: `HTTP ${ttsRes.status}` }))
      throw new Error((err as { detail?: string }).detail ?? `HTTP ${ttsRes.status}`)
    }

    const ttsData = (await ttsRes.json()) as {
      audio_url: string
      storage_path: string
      audio_size_bytes?: number
    }

    const textHash = calculateTextHash(text)
    const now = new Date()

    const updateData =
      side === 'front'
        ? {
            frontAudioUrl: ttsData.audio_url,
            frontAudioPath: ttsData.storage_path,
            frontAudioSize: ttsData.audio_size_bytes ?? null,
            frontAudioName: 'tts_generated.mp3',
            frontAudioSource: 'generated',
            frontAudioProvider: 'edge_tts',
            frontAudioLanguage: language,
            frontAudioVoice: voice,
            frontAudioTextHash: textHash,
            frontAudioGeneratedAt: now,
            audioUpdatedAt: now,
          }
        : {
            backAudioUrl: ttsData.audio_url,
            backAudioPath: ttsData.storage_path,
            backAudioSize: ttsData.audio_size_bytes ?? null,
            backAudioName: 'tts_generated.mp3',
            backAudioSource: 'generated',
            backAudioProvider: 'edge_tts',
            backAudioLanguage: language,
            backAudioVoice: voice,
            backAudioTextHash: textHash,
            backAudioGeneratedAt: now,
            audioUpdatedAt: now,
          }

    await prisma.flashcard.update({ where: { id: flashcardId }, data: updateData })

    return NextResponse.json({ ok: true, storagePath: ttsData.storage_path, textHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json(
      { error: `Não foi possível gerar o áudio. ${message}` },
      { status: 502 }
    )
  }
}
