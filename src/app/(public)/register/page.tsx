import type { Metadata } from 'next'
import { RegisterForm } from '@/components/forms/register-form'

export const metadata: Metadata = {
  title: 'Criar conta — StudyApp',
}

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Criar sua conta</h2>
        <p className="mt-1 text-sm text-gray-500">Comece a estudar gratuitamente</p>
      </div>
      <RegisterForm />
    </>
  )
}
