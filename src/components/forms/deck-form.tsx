'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { deckSchema, type DeckInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface DeckFormProps {
  defaultValues?: DeckInput
  action: (data: DeckInput) => Promise<{ error: string } | undefined>
  submitLabel?: string
  cancelHref?: string
}

export function DeckForm({
  defaultValues,
  action,
  submitLabel = 'Salvar',
  cancelHref = '/decks',
}: DeckFormProps) {
  const [serverError, setServerError] = useState<string>()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeckInput>({
    resolver: zodResolver(deckSchema),
    defaultValues: defaultValues ?? { name: '', description: '' },
  })

  const onSubmit = async (data: DeckInput) => {
    setServerError(undefined)
    const result = await action(data)
    if (result?.error) setServerError(result.error)
    // sem erro: Server Action redirecionou
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do deck</Label>
        <Input
          id="name"
          placeholder="Ex: Inglês — Vocabulário B2"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">
          Descrição <span className="font-normal text-gray-400">(opcional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Descreva o conteúdo deste deck..."
          error={errors.description?.message}
          {...register('description')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(cancelHref)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
