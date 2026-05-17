import { getSupabaseAdmin } from '@/lib/supabase/server'
import { AUDIO_BUCKET } from './audio-validation'

export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage.from(AUDIO_BUCKET).remove([storagePath])
  if (error) throw new Error(`Failed to delete audio: ${error.message}`)
}

export async function getSignedUploadUrl(storagePath: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(AUDIO_BUCKET)
    .createSignedUploadUrl(storagePath)
  if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`)
  return data.signedUrl
}

export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, 3600)
  if (error || !data) throw new Error(`Failed to create download URL: ${error?.message}`)
  return data.signedUrl
}
