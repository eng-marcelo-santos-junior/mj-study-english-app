import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audioUploadSchema, buildAudioStoragePath } from '@/lib/audio/audio-validation'
import { getSignedUploadUrl } from '@/lib/audio/audio-storage'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = audioUploadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { flashcardId, side, fileName, fileSize, mimeType } = parsed.data

  // Verify ownership
  const flashcard = await prisma.flashcard.findFirst({
    where: { id: flashcardId, deck: { userId: session.user.id } },
    select: { id: true },
  })
  if (!flashcard) {
    return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
  }

  const storagePath = buildAudioStoragePath(session.user.id, flashcardId, side, fileName)

  try {
    const signedUrl = await getSignedUploadUrl(storagePath)
    return NextResponse.json({ signedUrl, storagePath, fileName, fileSize, mimeType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
