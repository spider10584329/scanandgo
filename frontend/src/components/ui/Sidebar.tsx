'use client'

import { useState, useMemo, memo, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useClientName } from '@/hooks/useClientName'

interface SidebarProps {
  role: 'admin' | 'agent'
  currentPath?: string
  onLogout: () => void
  username?: string
}

interface SidebarRef {
  toggle: () => void
}

interface MenuItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  description?: string
}

const adminMenuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: <Image src="/dashboard.svg" alt="Dashboard" width={20} height={20} />
  },
  { 
    id: 'category', 
    label: 'Category', 
    href: '/admin/category', 
    icon: <Image src="/category.svg" alt="Category" width={20} height={20} />
  },
  { 
    id: 'location', 
    label: 'Location', 
    href: '/admin/location', 
    icon: <Image src="/location.svg" alt="Location" width={20} height={20} />
  },
  { 
    id: 'inventory', 
    label: 'Inventory', 
    href: '/admin/inventory', 
    icon: <Image src="/inventory.svg" alt="Inventory" width={20} height={20} />
  },
  { 
    id: 'move', 
    label: 'Move', 
    href: '/admin/move', 
    icon: <Image src="/move.svg" alt="Move" width={20} height={20} />
  },
  { 
    id: 'duplicates', 
    label: 'Duplicates', 
    href: '/admin/duplicates', 
    icon: <Image src="/duplicate.svg" alt="Duplicates" width={20} height={20} />
  },
  { 
    id: 'API Key', 
    label: 'API Key', 
    href: '/admin/apikey', 
    icon: <Image src="/key.svg" alt="API Key" width={20} height={20} />
  },
  { 
    id: 'snapshot', 
    label: 'Snapshot', 
    href: '/admin/snapshot', 
    icon: <Image src="/snapshot.svg" alt="Snapshot" width={20} height={20} />
  },
  { 
    id: 'user', 
    label: 'User', 
    href: '/admin/user', 
    icon: <Image src="/users.svg" alt="User" width={20} height={20} />
  },
  { 
    id: 'mobile-device', 
    label: 'Mobile device', 
    href: '/admin/mobile-device', 
    icon: <Image src="/mobile.svg" alt="Mobile device" width={20} height={20} />
  },
]

const agentMenuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/agent/dashboard', 
    icon: <Image src="/dashboard.svg" alt="Dashboard" width={20} height={20} />
  },
  { 
    id: 'category', 
    label: 'Category', 
    href: '/agent/category', 
    icon: <Image src="/category.svg" alt="Category" width={20} height={20} />
  },
  { 
    id: 'location', 
    label: 'Location', 
    href: '/agent/location', 
    icon: <Image src="/location.svg" alt="Location" width={20} height={20} />
  },
  { 
    id: 'inventory', 
    label: 'Inventory', 
    href: '/agent/inventory', 
    icon: <Image src="/inventory.svg" alt="Inventory" width={20} height={20} />
  },
  { 
    id: 'move', 
    label: 'Move', 
    href: '/agent/move', 
    icon: <Image src="/move.svg" alt="Move" width={20} height={20} />
  },
  { 
    id: 'duplicates', 
    label: 'Duplicates', 
    href: '/agent/duplicates', 
    icon: <Image src="/duplicate.svg" alt="Duplicates" width={20} height={20} />
  },
  { 
    id: 'mobile-device', 
    label: 'Mobile device', 
    href: '/agent/mobile-device', 
    icon: <Image src="/mobile.svg" alt="Mobile device" width={20} height={20} />
  },
]

const Sidebar = memo(forwardRef<SidebarRef, SidebarProps>(function Sidebar({ role, currentPath }, ref) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const { clientName } = useClientName()
  
  // Check screen size and auto-collapse on small screens
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmall = window.innerWidth < 600
      setIsSmallScreen(isSmall)
      
      // Auto-collapse on small screens, but allow manual control on larger screens
      if (isSmall) {
        setIsCollapsed(true)
      }
      // On larger screens, don't automatically change the collapsed state
      // Let user control it manually
    }

    // Check on mount
    checkScreenSize()

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // Memoize menu items to prevent recalculation on every render
  const menuItems = useMemo(() => role === 'admin' ? adminMenuItems : agentMenuItems, [role])

  // Memoize filtered menu items
  const filteredMenuItems = useMemo(() => {
    return role === 'admin' 
      ? menuItems 
      : menuItems.filter(item => item.label !== 'User' && item.label !== 'Snapshot')
  }, [role, menuItems])

  // Handle manual toggle - allow expansion on small screens for overlay mode
  const handleToggle = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  // Expose the toggle function to parent component via ref
  useImperativeHandle(ref, () => ({
    toggle: handleToggle
  }), [handleToggle])

  return (
    <>
      {/* Mobile Overlay */}
      {isSmallScreen && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isSmallScreen && !isCollapsed 
          ? 'fixed left-0 top-0 z-50 w-72' 
          : isCollapsed 
            ? 'w-16' 
            : 'w-72'
      }`}>
      {/* Header with Logo */}
      <div className="flex items-center px-2 py-5 border-b border-gray-200 h-[73px]">
        <div className="flex items-center space-x-3 w-full">
          <div className="flex-shrink-0 mx-auto">
            <Image 
                src="/logo.webp" 
                alt="Scanandgo Logo" 
                width={isCollapsed ? 40 : 64}
                height={isCollapsed ? 40 : 64}
                className="w-auto"
                />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="font-bold text-gray-900 text-lg truncate block">{clientName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = currentPath === item.href || currentPath?.startsWith(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex items-center px-2 py-2 mt-3 mb-3 text-sm font-medium rounded-xl transition-colors duration-150 border border-[#ffffff] ${
                  isActive
                    ? 'text-[#000000] bg-gray-100 border border-gray-300'
                    : 'text-[#000000] hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-grey-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </>
                )}
                {isCollapsed && item.badge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">{item.badge}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>

      </nav>

      {/* Developer Logo at Bottom */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-center">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              <Image 
                src="/clinotag.png" 
                alt="Clinotag" 
                width={80}
                height={80}                
              />
              
            </div>
          ) : (
            <Image 
              src="/clinotag.png" 
              alt="Clinotag" 
              width={28}
              height={28}             
              title="Powered by Clinotag"
            />
          )}
        </div>
      </div>
    </div>
    </>
  )
}))

export default Sidebar
