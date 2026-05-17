import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audioDeleteSchema, AUDIO_BUCKET } from '@/lib/audio/audio-validation'
import { deleteAudioFromStorage } from '@/lib/audio/audio-storage'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ flashcardId: string }> }

// Save audio metadata after successful upload
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { flashcardId } = await params
  const body = await request.json()
  const { side, storagePath, fileName, fileSize } = body

  if (!side || !storagePath || !fileName || !fileSize) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const flashcard = await prisma.flashcard.findFirst({
    where: { id: flashcardId, deck: { userId: session.user.id } },
    select: { id: true },
  })
  if (!flashcard) {
    return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
  }

  // Generate a signed URL to return as the public-ish access URL (re-signed on load)
  const { data: urlData } = await getSupabaseAdmin()
    .storage.from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, 3600 * 24 * 365) // 1 year placeholder

  const audioUrl = urlData?.signedUrl ?? ''

  const updateData =
    side === 'front'
      ? {
          frontAudioUrl: audioUrl,
          frontAudioPath: storagePath,
          frontAudioSize: fileSize,
          frontAudioName: fileName,
          audioUpdatedAt: new Date(),
        }
      : {
          backAudioUrl: audioUrl,
          backAudioPath: storagePath,
          backAudioSize: fileSize,
          backAudioName: fileName,
          audioUpdatedAt: new Date(),
        }

  await prisma.flashcard.update({ where: { id: flashcardId }, data: updateData })

  return NextResponse.json({ ok: true, storagePath })
}

// Delete audio
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { flashcardId } = await params
  const body = await request.json()
  const parsed = audioDeleteSchema.safeParse({ flashcardId, side: body.side })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { side } = parsed.data

  const flashcard = await prisma.flashcard.findFirst({
    where: { id: flashcardId, deck: { userId: session.user.id } },
    select: { frontAudioPath: true, backAudioPath: true },
  })
  if (!flashcard) {
    return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
  }

  const storagePath = side === 'front' ? flashcard.frontAudioPath : flashcard.backAudioPath
  if (storagePath) {
    try {
      await deleteAudioFromStorage(storagePath)
    } catch {
      // Continue even if storage delete fails
    }
  }

  const clearData =
    side === 'front'
      ? {
          frontAudioUrl: null,
          frontAudioPath: null,
          frontAudioSize: null,
          frontAudioName: null,
          audioUpdatedAt: new Date(),
        }
      : {
          backAudioUrl: null,
          backAudioPath: null,
          backAudioSize: null,
          backAudioName: null,
          audioUpdatedAt: new Date(),
        }

  await prisma.flashcard.update({ where: { id: flashcardId }, data: clearData })

  return NextResponse.json({ ok: true })
}
