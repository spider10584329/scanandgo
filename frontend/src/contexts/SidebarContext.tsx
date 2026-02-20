'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  isSmallScreen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebarToggle = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarToggle must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: ReactNode
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const isSmall = window.innerWidth < 600
      setIsSmallScreen(isSmall)
      if (isSmall) {
        setIsCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, isSmallScreen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}
