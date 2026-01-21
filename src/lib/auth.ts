import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    fullName: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      email: string
      fullName: string
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    fullName: string
    role: Role
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.error('[Auth] Login attempt for:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.error('[Auth] Missing credentials')
            throw new Error('Missing credentials')
          }

          console.error('[Auth] Querying database...')
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          console.error('[Auth] User found:', !!user, user?.email)

          if (!user || !user.isActive) {
            console.error('[Auth] User not found or inactive')
            throw new Error('User not found')
          }

          console.error('[Auth] Comparing password...')
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          console.error('[Auth] Password valid:', isValidPassword)

          if (!isValidPassword) {
            console.error('[Auth] Invalid password')
            throw new Error('Wrong password')
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          // Log the login
          await prisma.activityLog.create({
            data: {
              entityType: 'User',
              entityId: user.id,
              action: 'LOGIN',
              performedByUserId: user.id,
            },
          })

          console.error('[Auth] Login successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] Error during login:', error instanceof Error ? error.message : error)
          console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'no stack')
          // Re-throw with original message for debugging
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.fullName = user.fullName
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          fullName: token.fullName,
          role: token.role,
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
