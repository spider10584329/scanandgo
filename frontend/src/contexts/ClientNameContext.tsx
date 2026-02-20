'use client'

import { createContext, useContext, useCallback, useRef, ReactNode } from 'react'

interface ClientNameContextType {
  refreshClientName: () => void
  registerRefreshCallback: (callback: () => void) => void
  unregisterRefreshCallback: (callback: () => void) => void
}

const ClientNameContext = createContext<ClientNameContextType | undefined>(undefined)

// Max callbacks to prevent memory leaks
const MAX_CALLBACKS = 100

export function ClientNameProvider({ children }: { children: ReactNode }) {
  // Use useRef instead of useState to prevent unnecessary re-renders and memory growth
  const refreshCallbacksRef = useRef<Set<() => void>>(new Set())

  const refreshClientName = useCallback(() => {
    refreshCallbacksRef.current.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in refresh callback:', error)
      }
    })
  }, [])

  const registerRefreshCallback = useCallback((callback: () => void) => {
    // Prevent unbounded growth
    if (refreshCallbacksRef.current.size >= MAX_CALLBACKS) {
      console.warn('Max refresh callbacks reached, skipping registration')
      return
    }
    refreshCallbacksRef.current.add(callback)
  }, [])

  const unregisterRefreshCallback = useCallback((callback: () => void) => {
    refreshCallbacksRef.current.delete(callback)
  }, [])

  return (
    <ClientNameContext.Provider value={{
      refreshClientName,
      registerRefreshCallback,
      unregisterRefreshCallback
    }}>
      {children}
    </ClientNameContext.Provider>
  )
}

export function useClientNameContext() {
  const context = useContext(ClientNameContext)
  if (context === undefined) {
    // Provide a fallback for cases where the context is not available
    return {
      refreshClientName: () => {},
      registerRefreshCallback: () => {},
      unregisterRefreshCallback: () => {}
    }
  }
  return context
}
