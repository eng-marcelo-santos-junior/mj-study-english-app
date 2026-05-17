import type { Metadata } from 'next'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Dashboard — StudyApp',
}

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Usuário'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Olá, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Aqui está o resumo dos seus estudos</p>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Decks', value: '0', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Flashcards', value: '0', color: 'bg-blue-50 text-blue-700' },
          { label: 'Para revisar hoje', value: '0', color: 'bg-amber-50 text-amber-700' },
          { label: 'Revisados hoje', value: '0', color: 'bg-green-50 text-green-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <svg
            className="h-7 w-7 text-indigo-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-medium text-gray-900">Nenhum deck ainda</h3>
        <p className="mt-1 text-sm text-gray-500">Crie seu primeiro deck para começar a estudar</p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Criar deck
        </button>
      </div>
    </div>
  )
}
