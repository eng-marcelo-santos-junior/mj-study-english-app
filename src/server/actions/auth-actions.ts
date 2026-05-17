'use server'

import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth'
import { registerSchema, loginSchema } from '@/lib/validations'
import type { RegisterInput, LoginInput } from '@/lib/validations'

export type ActionResult = { error: string } | undefined

export async function registerAction(data: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Este e-mail já está cadastrado.' }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({ data: { name, email, passwordHash } })

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError)
      return { error: 'Conta criada, mas erro ao entrar. Faça login.' }
    throw error
  }
}

export async function loginAction(data: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'E-mail ou senha incorretos.' }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
