import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserWithRole, verifyPassword } from '@/lib/database'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {          
          console.log('❌ Authorize: Missing credentials')
          return null
        }

        try {
          console.log('🔍 Authorize: Looking up user:', credentials.username)
          const user = await getUserWithRole(credentials.username)
          
          if (!user) {
            console.log('❌ Authorize: User not found')
            return null
          }

          console.log('🔍 Authorize: User found, verifying password...')
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('❌ Authorize: Invalid password')
            return null
          }

          const userObject = {
            id: user.id.toString(),
            email: user.username,
            name: user.username,
            role: user.roleRef?.name || 'user'
          }
          
          console.log('✅ Authorize: Returning user object:', userObject)
          return userObject
        } catch (error) {
          console.error('❌ Authorize: Database error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {      
      if (user) {
        token.role = user.role
      }      
      return token
    },
    async session({ session, token }) {      
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
      }
      
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt'
  }
}
