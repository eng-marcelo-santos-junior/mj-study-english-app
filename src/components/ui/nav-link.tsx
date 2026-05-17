'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-indigo-50 font-medium text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}
