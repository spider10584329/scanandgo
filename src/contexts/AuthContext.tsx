'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface TokenPayload {
  userId: number
  username: string
  email?: string
  role: 'admin' | 'agent'
  isActive: boolean
  customerId: number
}

interface AuthContextType {
  user: TokenPayload | null
  isLoading: boolean
  login: (token: string) => Promise<boolean>
  logout: () => void
  clearStaleTokens: () => void
  isTokenValid: (token: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Helper function to get cookie value
  const getCookieValue = useCallback((name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }, [])

  // Clear all authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth-token')
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict'
    
    // Clear any other auth-related localStorage items
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }, [])

  // Validate token with server
  const isTokenValid = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.valid && data.payload?.isActive && data.payload?.customerId
    } catch (error) {
      console.error('AuthProvider: Token validation failed:', error)
      return false
    }
  }, [])

  // Clear stale tokens
  const clearStaleTokens = useCallback(async () => {
    const token = localStorage.getItem('auth-token') || getCookieValue('auth-token')
    
    if (token) {
      const isValid = await isTokenValid(token)
      if (!isValid) {

        clearAuthData()
        setUser(null)
      }
    }
  }, [getCookieValue, isTokenValid, clearAuthData])

  // Login function
  const login = useCallback(async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      
      // Clear any existing auth data first to prevent conflicts
      clearAuthData()
      
      // Verify token directly
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        console.error(`AuthProvider: Token verification failed with status: ${response.status}`)
        setIsLoading(false)
        return false
      }

      const data = await response.json()

      
      if (data.valid && data.payload?.isActive && data.payload?.customerId) {

        // Store token only after successful verification
        localStorage.setItem('auth-token', token)
        document.cookie = `auth-token=${token}; path=/; max-age=${12 * 60 * 60}; secure; samesite=strict`
        
        setUser(data.payload)
        setIsLoading(false) // Set loading to false before returning success

        return true
      } else {
        console.error('AuthProvider: Token validation failed - invalid payload or missing customerId:', {
          valid: data.valid,
          isActive: data.payload?.isActive,
          customerId: data.payload?.customerId,
          payload: data.payload
        })
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error('AuthProvider: Login failed:', error)
      setIsLoading(false)
      return false
    }
  }, [clearAuthData])

  // Logout function
  const logout = useCallback(() => {
    clearAuthData()
    setUser(null)
    router.push('/')
  }, [clearAuthData, router])

  // Check authentication on mount
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      if (!isMounted) return
      setIsLoading(true)
      
      try {
        const token = localStorage.getItem('auth-token') || getCookieValue('auth-token')
        
        if (!token) {
          if (isMounted) setIsLoading(false)
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
        
        if (!isMounted) return
        
        if (!data.valid || !data.payload?.isActive || !data.payload?.customerId) {
          clearAuthData()
          setUser(null)
        } else {
          setUser(data.payload)
        }
      } catch (error) {
        console.error('AuthProvider: Auth check failed:', error)
        if (isMounted) {
          clearAuthData()
          setUser(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    // Initial check only
    checkAuth()

    return () => {
      isMounted = false
    }
  }, [getCookieValue, clearAuthData])

  // Separate effect for periodic cleanup - only runs when user is logged in
  useEffect(() => {
    if (!user) return

    const intervalId = setInterval(() => {
      clearStaleTokens()
    }, 10 * 60 * 1000) // 10 minutes

    return () => {
      clearInterval(intervalId)
    }
  }, [user, clearStaleTokens])

  // Browser session cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Mark session as closed for potential cleanup on next visit
      sessionStorage.setItem('session-closed', 'true')
    }

    const handleLoad = () => {
      // Check if we're returning from a closed session
      if (sessionStorage.getItem('session-closed') === 'true') {
        clearStaleTokens()
        sessionStorage.removeItem('session-closed')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('load', handleLoad)

    // Check on component mount
    handleLoad()

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('load', handleLoad)
    }
  }, [clearStaleTokens])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        clearStaleTokens,
        isTokenValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
