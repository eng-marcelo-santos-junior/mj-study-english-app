'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/server/actions/auth-actions'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/decks', label: 'Meus Decks' },
]

interface MobileHeaderProps {
  userName: string
}

export function MobileHeader({ userName }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
          S
        </div>
        <span className="text-sm font-semibold text-gray-900">StudyApp</span>
      </Link>

      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        aria-label="Menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-gray-200 bg-white shadow-md">
          <nav className="flex flex-col p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-1 border-t border-gray-100" />
            <div className="px-4 py-1 text-xs font-medium text-gray-500">{userName}</div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  )
}
