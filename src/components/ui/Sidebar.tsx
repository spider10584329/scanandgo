'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SidebarProps {
  role: 'admin' | 'agent'
  currentPath?: string
  onLogout: () => void
  username?: string
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
    id: 'snapshot', 
    label: 'Snapshot', 
    href: '/agent/snapshot', 
    icon: <Image src="/snapshot.svg" alt="Snapshot" width={20} height={20} />
  },
  { 
    id: 'user', 
    label: 'User', 
    href: '/agent/user', 
    icon: <Image src="/users.svg" alt="User" width={20} height={20} />
  },
]

export default function Sidebar({ role, currentPath }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const menuItems = role === 'admin' ? adminMenuItems : agentMenuItems



  const filteredMenuItems = role === 'admin' 
    ? menuItems 
    : menuItems.filter(item => item.label !== 'User' && item.label !== 'Snapshot')

  return (
    <div className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header with Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200  h-[73px]">
        <div className="flex items-center space-x-3">
          <div >
            <Image 
                src="/logo.webp" 
                alt="Scanandgo Logo" 
                width={64}
                height={64}
                className="mx-auto w-auto"
                />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-gray-900 text-lg">RFID Hotel</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
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
                className={`group flex items-center px-2 py-2 mt-3 mb-3 text-sm font-medium rounded-xl transition-all duration-200 border border-[#ffffff] ${
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
    </div>
  )
}
