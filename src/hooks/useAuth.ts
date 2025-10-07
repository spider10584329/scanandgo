'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TokenPayload {
  userId: number
  username: string
  email?: string
  role: 'admin' | 'agent'
  isActive: boolean
}

interface UseAuthResult {
  user: TokenPayload | null
  isLoading: boolean
  logout: () => void
}

export const useAuth = (requiredRole?: 'admin' | 'agent', redirectTo: string = '/'): UseAuthResult => {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Helper function to get cookie value
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  // Helper function to clear auth data
  const clearAuthData = () => {
    localStorage.removeItem('auth-token')
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }

  const logout = () => {
    clearAuthData()
    setUser(null)
    router.push(redirectTo)
  }

  useEffect(() => {
    const checkAuth = async () => {
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false)
      }, 5000)
      
      try {
        const token = localStorage.getItem('auth-token') || getCookieValue('auth-token')
        
        if (!token) {
          clearTimeout(timeoutId)
          setIsLoading(false)
          router.push(redirectTo)
          return
        }

        const response = await fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error(`Token verification failed with status: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data.valid) {
          clearAuthData()
          clearTimeout(timeoutId)
          setIsLoading(false)
          router.push(redirectTo)
          return
        }

        // Check role if required
        if (requiredRole && data.payload.role !== requiredRole) {
          clearAuthData()
          clearTimeout(timeoutId)
          setIsLoading(false)
          router.push(redirectTo)
          return
        }

        // Check if user is active
        if (!data.payload.isActive) {
          clearAuthData()
          clearTimeout(timeoutId)
          setIsLoading(false)
          router.push(redirectTo)
          return
        }

        setUser(data.payload)
        clearTimeout(timeoutId)
        setIsLoading(false)
      } catch (error) {
        console.error('useAuth: Auth check failed:', error)
        clearAuthData()
        clearTimeout(timeoutId)
        setIsLoading(false)
        router.push(redirectTo)
      }
    }
    
    checkAuth()
  }, [router, requiredRole, redirectTo])

  return {
    user,
    isLoading,
    logout
  }
}
