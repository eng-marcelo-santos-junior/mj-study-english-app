'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/server/actions/auth-actions'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/decks', label: 'Meus Decks' },
  { href: '/stats', label: 'Estatísticas' },
]

interface MobileHeaderProps {
  userName: string
}

export function MobileHeader({ userName }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            S
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">StudyApp</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Drawer */}
          <nav
            id="mobile-nav"
            aria-label="Navegação móvel"
            className="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white md:hidden dark:border-gray-800 dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  S
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  StudyApp
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* User + actions */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-2 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                {userName}
              </p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Sair
                </button>
              </form>
            </div>
          </nav>
        </>
      )}
    </>
  )
}
