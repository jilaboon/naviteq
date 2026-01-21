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
          console.log('[Auth] Login attempt for:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing credentials')
            throw new Error('Invalid credentials')
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          console.log('[Auth] User found:', !!user)

          if (!user || !user.isActive) {
            console.log('[Auth] User not found or inactive')
            throw new Error('Invalid credentials')
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          console.log('[Auth] Password valid:', isValidPassword)

          if (!isValidPassword) {
            console.log('[Auth] Invalid password')
            throw new Error('Invalid credentials')
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

          console.log('[Auth] Login successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] Error during login:', error)
          throw new Error('Invalid credentials')
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
