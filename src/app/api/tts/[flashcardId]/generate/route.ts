import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cleanHtmlText, calculateTextHash } from '@/lib/tts/text-utils'
import { synthesize } from '@/lib/tts/edge-tts-client'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { AUDIO_BUCKET } from '@/lib/audio/audio-validation'
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

  if (!voice && TTS_SERVER_URL) {
    return NextResponse.json({ error: 'Voice must be specified.' }, { status: 400 })
  }

  try {
    let audioUrl: string
    let storagePath: string
    let audioSizeBytes: number

    if (TTS_SERVER_URL) {
      // Primary: Python TTS service handles generation + Supabase upload
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
      audioUrl = ttsData.audio_url
      storagePath = ttsData.storage_path
      audioSizeBytes = ttsData.audio_size_bytes ?? 0
    } else {
      // Fallback: Google Translate TTS + direct Supabase upload from Next.js
      const audioBuffer = await synthesize(text, language)
      storagePath = `${userId}/${flashcardId}/${side}.mp3`
      audioSizeBytes = audioBuffer.byteLength

      const supabase = getSupabaseAdmin()
      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(storagePath, audioBuffer, { contentType: 'audio/mpeg', upsert: true })
      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

      const { data: signedData, error: signError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365)
      if (signError || !signedData) throw new Error(`Failed to create signed URL`)
      audioUrl = signedData.signedUrl
    }

    const provider = TTS_SERVER_URL ? 'edge_tts' : 'google_translate'
    const textHash = calculateTextHash(text)
    const now = new Date()

    const updateData =
      side === 'front'
        ? {
            frontAudioUrl: audioUrl,
            frontAudioPath: storagePath,
            frontAudioSize: audioSizeBytes,
            frontAudioName: 'tts_generated.mp3',
            frontAudioSource: 'generated',
            frontAudioProvider: provider,
            frontAudioLanguage: language,
            frontAudioVoice: voice ?? null,
            frontAudioTextHash: textHash,
            frontAudioGeneratedAt: now,
            audioUpdatedAt: now,
          }
        : {
            backAudioUrl: audioUrl,
            backAudioPath: storagePath,
            backAudioSize: audioSizeBytes,
            backAudioName: 'tts_generated.mp3',
            backAudioSource: 'generated',
            backAudioProvider: provider,
            backAudioLanguage: language,
            backAudioVoice: voice ?? null,
            backAudioTextHash: textHash,
            backAudioGeneratedAt: now,
            audioUpdatedAt: now,
          }

    await prisma.flashcard.update({ where: { id: flashcardId }, data: updateData })

    return NextResponse.json({ ok: true, storagePath, textHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json(
      { error: `Não foi possível gerar o áudio. ${message}` },
      { status: 502 }
    )
  }
}
