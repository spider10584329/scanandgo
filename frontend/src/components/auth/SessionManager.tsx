'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

/**
 * SessionManager handles browser session lifecycle and cleanup
 * This component should be included at the root level to manage session state
 */
export default function SessionManager() {
  const { clearStaleTokens, user } = useAuthContext()
  const router = useRouter()

  // Use refs to store latest values without causing re-subscriptions
  const userRef = useRef(user)
  const clearStaleTokensRef = useRef(clearStaleTokens)

  // Keep refs updated
  useEffect(() => {
    userRef.current = user
    clearStaleTokensRef.current = clearStaleTokens
  }, [user, clearStaleTokens])

  // Debounce token validation to prevent rapid-fire calls
  const lastValidationRef = useRef<number>(0)
  const VALIDATION_DEBOUNCE_MS = 5000  // 5 seconds

  const debouncedClearStaleTokens = useCallback(() => {
    const now = Date.now()
    if (now - lastValidationRef.current > VALIDATION_DEBOUNCE_MS) {
      lastValidationRef.current = now
      clearStaleTokensRef.current()
    }
  }, [])

  useEffect(() => {
    // Handle page visibility changes (tab switching, minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedClearStaleTokens()
      }
    }

    // Handle browser focus events
    const handleFocus = () => {
      if (userRef.current) {
        debouncedClearStaleTokens()
      }
    }

    // Handle storage events (if user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-token' && e.newValue === null) {
        router.push('/')
      }
    }

    // Handle unload events (browser closing)
    const handleBeforeUnload = () => {
      sessionStorage.setItem('session-ending', 'true')
    }

    // Check for interrupted sessions on load
    const handleLoad = () => {
      const sessionEnding = sessionStorage.getItem('session-ending')
      const sessionClosed = sessionStorage.getItem('session-closed')

      if (sessionEnding === 'true' || sessionClosed === 'true') {
        debouncedClearStaleTokens()
        sessionStorage.removeItem('session-ending')
        sessionStorage.removeItem('session-closed')
      }
    }

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Check on mount
    handleLoad()

    // Cleanup event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [router, debouncedClearStaleTokens])  // Minimal dependencies

  // This component doesn't render anything
  return null
}
