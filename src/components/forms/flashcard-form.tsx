'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashcardSchema, type FlashcardInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface FlashcardFormProps {
  defaultValues?: FlashcardInput
  action: (data: FlashcardInput) => Promise<{ error: string } | undefined>
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
  showAddAnother?: boolean
  onAddAnother?: (data: FlashcardInput) => Promise<{ error: string } | undefined>
}

export function FlashcardForm({
  defaultValues,
  action,
  onSuccess,
  onCancel,
  submitLabel = 'Salvar',
  showAddAnother = false,
  onAddAnother,
}: FlashcardFormProps) {
  const [serverError, setServerError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FlashcardInput>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: defaultValues ?? { front: '', back: '' },
  })

  const onSubmit = async (data: FlashcardInput) => {
    setServerError(undefined)
    setSuccessMessage(undefined)
    const result = await action(data)
    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess?.()
  }

  const onSubmitAndContinue = async (data: FlashcardInput) => {
    if (!onAddAnother) return
    setServerError(undefined)
    setSuccessMessage(undefined)
    const result = await onAddAnother(data)
    if (result?.error) {
      setServerError(result.error)
      return
    }
    reset({ front: '', back: '' })
    setSuccessMessage('Card adicionado!')
    setTimeout(() => setSuccessMessage(undefined), 2000)
  }

  return (
    <form className="flex flex-col gap-5">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="front">Frente</Label>
        <Textarea
          id="front"
          rows={4}
          placeholder="Pergunta ou termo..."
          error={errors.front?.message}
          {...register('front')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="back">Verso</Label>
        <Textarea
          id="back"
          rows={4}
          placeholder="Resposta ou definição..."
          error={errors.back?.message}
          {...register('back')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}

        {showAddAnother && onAddAnother && (
          <Button
            type="button"
            variant="ghost"
            loading={isSubmitting}
            onClick={handleSubmit(onSubmitAndContinue)}
          >
            Salvar e adicionar outro
          </Button>
        )}

        <Button type="button" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
