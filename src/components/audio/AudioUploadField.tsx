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
  // Pending mode (no flashcardId): called when user selects or removes a file
  onFileSelected?: (file: File | null) => void
  disabled?: boolean
}

export async function uploadAudioFile(file: File, flashcardId: string, side: 'front' | 'back') {
  const urlRes = await fetch('/api/audio/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flashcardId,
      side,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  })
  if (!urlRes.ok) {
    const { error } = await urlRes.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error ?? 'Falha ao obter URL de upload')
  }
  const { signedUrl, storagePath } = await urlRes.json()

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!uploadRes.ok) throw new Error('Falha no upload do arquivo')

  const metaRes = await fetch(`/api/audio/${flashcardId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side, storagePath, fileName: file.name, fileSize: file.size }),
  })
  if (!metaRes.ok) throw new Error('Falha ao salvar metadados')
}

export function AudioUploadField({
  side,
  flashcardId,
  existingAudioUrl,
  existingAudioName,
  onUploadComplete,
  onDeleteComplete,
  onFileSelected,
  disabled = false,
}: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPendingMode = !flashcardId && !!onFileSelected
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

    // Revoke previous blob URL
    if (localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl)

    const blobUrl = URL.createObjectURL(file)
    setLocalFile(file)
    setLocalPreviewUrl(blobUrl)

    if (isPendingMode) {
      onFileSelected(file)
    }
  }

  function handleRemovePending() {
    if (localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl)
    setLocalFile(null)
    setLocalPreviewUrl(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onFileSelected?.(null)
  }

  async function handleUpload() {
    if (!localFile || !flashcardId) return
    setUploading(true)
    setError(null)
    try {
      await uploadAudioFile(localFile, flashcardId, side)
      setLocalFile(null)
      setLocalPreviewUrl(null)
      onUploadComplete?.('', localFile.name, localFile.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!flashcardId) {
      handleRemovePending()
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
        {isPendingMode && localFile && (
          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
            será enviado ao salvar
          </span>
        )}
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

        {/* Existing card: confirm upload button for newly selected file */}
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

        {/* Remove button */}
        {previewUrl && (
          <button
            type="button"
            onClick={isPendingMode ? handleRemovePending : handleDelete}
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
