import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { synthesize } from '@/lib/tts/edge-tts-client'
import { cleanHtmlText, calculateTextHash } from '@/lib/tts/text-utils'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AUDIO_BUCKET } from '@/lib/audio/audio-validation'
import { z } from 'zod'

const schema = z.object({
  side: z.enum(['front', 'back']),
  language: z.string().min(1),
  voice: z.string().optional(),
})

const TTS_SERVER_URL = process.env.TTS_SERVER_URL

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

  const { side, language, voice } = parsed.data
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

  try {
    let audioBuffer: Buffer
    let provider: string

    if (TTS_SERVER_URL && voice) {
      const res = await fetch(`${TTS_SERVER_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`)
      }
      audioBuffer = Buffer.from(await res.arrayBuffer())
      provider = 'edge_tts'
    } else {
      audioBuffer = await synthesize(text, language)
      provider = 'google_tts'
    }

    const textHash = calculateTextHash(text)
    const storagePath = `${userId}/${flashcardId}/${side}.mp3`

    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from(AUDIO_BUCKET)
      .upload(storagePath, audioBuffer, { contentType: 'audio/mpeg', upsert: true })
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: urlData } = await getSupabaseAdmin()
      .storage.from(AUDIO_BUCKET)
      .createSignedUrl(storagePath, 3600 * 24 * 365)
    const audioUrl = urlData?.signedUrl ?? ''

    const now = new Date()
    const updateData =
      side === 'front'
        ? {
            frontAudioUrl: audioUrl,
            frontAudioPath: storagePath,
            frontAudioSize: audioBuffer.length,
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
            backAudioSize: audioBuffer.length,
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
