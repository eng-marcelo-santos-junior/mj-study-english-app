import type { Metadata } from 'next'
import { LoginForm } from '@/components/forms/login-form'

export const metadata: Metadata = {
  title: 'Entrar — StudyApp',
}

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Entrar na sua conta
        </h2>
        <p className="mt-1 text-sm text-gray-500">Bem-vindo de volta</p>
      </div>
      <LoginForm />
    </>
  )
}
