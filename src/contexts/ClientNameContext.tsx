'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ClientNameContextType {
  refreshClientName: () => void
  registerRefreshCallback: (callback: () => void) => void
  unregisterRefreshCallback: (callback: () => void) => void
}

const ClientNameContext = createContext<ClientNameContextType | undefined>(undefined)

export function ClientNameProvider({ children }: { children: ReactNode }) {
  const [refreshCallbacks, setRefreshCallbacks] = useState<Set<() => void>>(new Set())

  const refreshClientName = useCallback(() => {
    refreshCallbacks.forEach(callback => callback())
  }, [refreshCallbacks])

  const registerRefreshCallback = useCallback((callback: () => void) => {
    setRefreshCallbacks(prev => new Set(prev).add(callback))
  }, [])

  const unregisterRefreshCallback = useCallback((callback: () => void) => {
    setRefreshCallbacks(prev => {
      const newSet = new Set(prev)
      newSet.delete(callback)
      return newSet
    })
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
