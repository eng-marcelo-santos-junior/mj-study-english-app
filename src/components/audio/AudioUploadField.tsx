'use client'

import { useRef, useState } from 'react'
import { Mic, Trash2, Upload } from 'lucide-react'
import { AudioPlayer } from './AudioPlayer'
import { validateAudioFile } from '@/lib/audio/audio-validation'

interface AudioUploadFieldProps {
  side: 'front' | 'back'
  flashcardId?: string
  existingAudioUrl?: string | null
  existingAudioName?: string | null
  onUploadComplete?: (storagePath: string, fileName: string, fileSize: number) => void
  onDeleteComplete?: () => void
  disabled?: boolean
}

export function AudioUploadField({
  side,
  flashcardId,
  existingAudioUrl,
  existingAudioName,
  onUploadComplete,
  onDeleteComplete,
  disabled = false,
}: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasExisting = !!existingAudioUrl
  const previewUrl = localPreviewUrl ?? existingAudioUrl ?? null
  const previewName = localFile?.name ?? existingAudioName ?? null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateAudioFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLocalFile(file)
    setLocalPreviewUrl(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!localFile || !flashcardId) return
    setUploading(true)
    setError(null)

    try {
      // Step 1: get signed upload URL
      const urlRes = await fetch('/api/audio/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcardId,
          side,
          fileName: localFile.name,
          fileSize: localFile.size,
          mimeType: localFile.type,
        }),
      })

      if (!urlRes.ok) {
        const { error: msg } = await urlRes.json()
        throw new Error(msg ?? 'Falha ao obter URL de upload')
      }

      const { signedUrl, storagePath } = await urlRes.json()

      // Step 2: upload directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': localFile.type },
        body: localFile,
      })

      if (!uploadRes.ok) throw new Error('Falha no upload do arquivo')

      // Step 3: save metadata
      const metaRes = await fetch(`/api/audio/${flashcardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          storagePath,
          fileName: localFile.name,
          fileSize: localFile.size,
        }),
      })

      if (!metaRes.ok) throw new Error('Falha ao salvar metadados')

      setLocalFile(null)
      setLocalPreviewUrl(null)
      onUploadComplete?.(storagePath, localFile.name, localFile.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!flashcardId) {
      // Just clear local state
      setLocalFile(null)
      setLocalPreviewUrl(null)
      return
    }
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/audio/${flashcardId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side }),
      })
      if (!res.ok) throw new Error('Falha ao remover áudio')
      setLocalFile(null)
      setLocalPreviewUrl(null)
      onDeleteComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setDeleting(false)
    }
  }

  const sideLabel = side === 'front' ? 'Frente' : 'Verso'

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Mic className="h-4 w-4" />
        Áudio — {sideLabel}
      </label>

      {previewUrl && (
        <AudioPlayer src={previewUrl} label={previewName ?? undefined} className="w-full" />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-2">
        {!previewUrl && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Upload className="h-4 w-4" />
              Selecionar arquivo
            </button>
          </>
        )}

        {localFile && !hasExisting && flashcardId && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Confirmar upload'}
          </button>
        )}

        {previewUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled || deleting}
            className="flex items-center gap-1.5 rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Removendo...' : 'Remover'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">MP3 ou WAV, máximo 10 MB</p>
    </div>
  )
}
