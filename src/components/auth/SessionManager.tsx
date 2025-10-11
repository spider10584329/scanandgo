'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

/**
 * SessionManager handles browser session lifecycle and cleanup
 * This component should be included at the root level to manage session state
 */
export default function SessionManager() {
  const { clearStaleTokens, user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    // Handle page visibility changes (tab switching, minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check for stale tokens
        clearStaleTokens()
      }
    }

    // Handle browser focus events
    const handleFocus = () => {
      // Browser window gained focus, validate session
      if (user) {
        clearStaleTokens()
      }
    }

    // Handle storage events (if user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-token' && e.newValue === null) {
        // Token was removed in another tab, redirect to home

        router.push('/')
      }
    }

    // Handle unload events (browser closing)
    const handleBeforeUnload = () => {
      // Mark that the session is ending
      sessionStorage.setItem('session-ending', 'true')
    }

    // Check for interrupted sessions on load
    const handleLoad = () => {
      const sessionEnding = sessionStorage.getItem('session-ending')
      const sessionClosed = sessionStorage.getItem('session-closed')
      
      if (sessionEnding === 'true' || sessionClosed === 'true') {

        clearStaleTokens()
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
  }, [clearStaleTokens, user, router])

  // This component doesn't render anything
  return null
}
