import { z } from 'zod'

export const AUDIO_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const AUDIO_ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav']
export const AUDIO_ALLOWED_EXTENSIONS = ['.mp3', '.wav']
export const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET ?? 'flashcard-audios'

export const audioUploadSchema = z.object({
  flashcardId: z.string().min(1),
  side: z.enum(['front', 'back']),
  fileName: z.string().min(1),
  fileSize: z.number().max(AUDIO_MAX_SIZE_BYTES, 'File must be under 10 MB'),
  mimeType: z
    .string()
    .refine((t) => AUDIO_ALLOWED_TYPES.includes(t), 'Only MP3 and WAV files are allowed'),
})

export const audioDeleteSchema = z.object({
  flashcardId: z.string().min(1),
  side: z.enum(['front', 'back']),
})

export type AudioUploadInput = z.infer<typeof audioUploadSchema>
export type AudioDeleteInput = z.infer<typeof audioDeleteSchema>

export function validateAudioFile(file: File): string | null {
  if (!AUDIO_ALLOWED_TYPES.includes(file.type)) {
    return 'Apenas arquivos MP3 e WAV são permitidos.'
  }
  if (file.size > AUDIO_MAX_SIZE_BYTES) {
    return 'O arquivo deve ter no máximo 10 MB.'
  }
  return null
}

export function buildAudioStoragePath(
  userId: string,
  flashcardId: string,
  side: 'front' | 'back',
  fileName: string
) {
  const ext = fileName.slice(fileName.lastIndexOf('.'))
  return `${userId}/${flashcardId}/${side}${ext}`
}
