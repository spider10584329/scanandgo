'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'

interface UseAuthResult {
  user: any
  isLoading: boolean
  logout: () => void
}

export const useAuth = (requiredRole?: 'admin' | 'agent', redirectTo: string = '/'): UseAuthResult => {
  const { user, isLoading, logout: contextLogout } = useAuthContext()
  const router = useRouter()

  const logout = () => {
    contextLogout()
    router.push(redirectTo)
  }

  useEffect(() => {
    if (isLoading) return

    // If no user and we need authentication, redirect
    if (!user) {
      router.push(redirectTo)
      return
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      console.warn(`useAuth: Role mismatch. Required: ${requiredRole}, Got: ${user.role}`)
      logout()
      return
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn('useAuth: User is inactive')
      logout()
      return
    }
  }, [user, isLoading, requiredRole, redirectTo, router])

  return {
    user,
    isLoading,
    logout
  }
}
