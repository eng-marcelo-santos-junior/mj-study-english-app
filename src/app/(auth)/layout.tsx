import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header — mobile */}
        <MobileHeader userName={session.user?.name ?? 'Usuário'} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
