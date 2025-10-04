'use client'

import { useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'

/**
 * Hook to handle session cleanup on browser close or page unload
 * This ensures sessions don't persist inappropriately
 */
export function useSessionCleanup() {
  const { data: session } = useSession()

  useEffect(() => {
    // Function to handle cleanup before page unload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if this is actually a browser close vs page navigation
      // We only want to cleanup on browser close, not on every navigation
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const isReload = navigationEntry?.type === 'reload'
      const isNavigation = navigationEntry?.type === 'navigate'
      
      // If it's not a reload or navigation, it's likely a browser close
      if (!isReload && !isNavigation && session) {
        console.log('🔒 Browser closing - cleaning up session')
        // Clear session data from localStorage/sessionStorage
        localStorage.removeItem('next-auth.callback-url')
        localStorage.removeItem('next-auth.csrf-token')
        sessionStorage.clear()
      }
    }

    // Function to handle visibility change (when user switches tabs/minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && session) {
        // Store timestamp when page becomes hidden
        sessionStorage.setItem('session-hidden-time', Date.now().toString())
      } else if (document.visibilityState === 'visible' && session) {
        // Check if page was hidden for too long (e.g., 1 hour)
        const hiddenTime = sessionStorage.getItem('session-hidden-time')
        if (hiddenTime) {
          const hiddenDuration = Date.now() - parseInt(hiddenTime)
          const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
          
          if (hiddenDuration > oneHour) {
            console.log('🔒 Session expired due to inactivity - signing out')
            signOut({ callbackUrl: '/auth/signin' })
          }
        }
        sessionStorage.removeItem('session-hidden-time')
      }
    }

    // Function to check for stale sessions on page load
    const checkStaleSession = () => {
      const lastActivity = localStorage.getItem('last-activity')
      if (lastActivity && session) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity)
        const maxInactivity = 24 * 60 * 60 * 1000 // 24 hours
        
        if (timeSinceActivity > maxInactivity) {
          console.log('🔒 Stale session detected - signing out')
          signOut({ callbackUrl: '/auth/signin' })
          return
        }
      }
      
      // Update last activity timestamp
      if (session) {
        localStorage.setItem('last-activity', Date.now().toString())
      }
    }

    // Set up event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Check for stale session on mount
      checkStaleSession()
      
      // Update activity timestamp periodically
      const activityInterval = setInterval(() => {
        if (session && document.visibilityState === 'visible') {
          localStorage.setItem('last-activity', Date.now().toString())
        }
      }, 5 * 60 * 1000) // Every 5 minutes

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        clearInterval(activityInterval)
      }
    }
  }, [session])

  // Return session cleanup function that can be called manually
  const cleanupSession = () => {
    localStorage.removeItem('next-auth.callback-url')
    localStorage.removeItem('next-auth.csrf-token')
    localStorage.removeItem('last-activity')
    sessionStorage.clear()
  }

  return { cleanupSession }
}
