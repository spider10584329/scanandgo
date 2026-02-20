'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

interface SecurityGuardProps {
  children: React.ReactNode
  requiredRole: 'admin' | 'agent'
  allowedPaths?: string[]
}

/**
 * Security component that protects pages from unauthorized access
 * Provides client-side validation in addition to middleware protection
 */
export default function SecurityGuard({ children, requiredRole, allowedPaths }: SecurityGuardProps) {
  const { user, isLoading, logout } = useAuth(requiredRole)
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    // Security checks
    if (!user) {
      setSecurityError('Authentication required')
      setIsAuthorized(false)
      return
    }

    if (user.role !== requiredRole) {
      setSecurityError(`Insufficient permissions: ${user.role} cannot access ${requiredRole} content`)
      console.warn(`Security Alert: User ${user.userId} (${user.role}) attempted to access ${requiredRole} content at ${pathname}`)
      logout()
      return
    }

    if (!user.isActive) {
      setSecurityError('Account is inactive')
      logout()
      return
    }

    // Check if current path is allowed for this role
    const basePath = `/${requiredRole}`
    if (!pathname.startsWith(basePath)) {
      setSecurityError('Invalid path for role')
      console.warn(`Security Alert: Invalid path access attempt by ${user.role} user to ${pathname}`)
      router.replace(`${basePath}/dashboard`)
      return
    }

    // Additional path restrictions if specified
    if (allowedPaths && !allowedPaths.some(path => pathname.startsWith(path))) {
      setSecurityError('Path not allowed for this user')
      console.warn(`Security Alert: Restricted path access attempt by user ${user.userId} to ${pathname}`)
      router.replace(`${basePath}/dashboard`)
      return
    }

    setIsAuthorized(true)
    setSecurityError(null)
  }, [user, isLoading, requiredRole, pathname, allowedPaths, logout, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Image 
            src="/6-dots-spinner.svg" 
            alt="Loading..." 
            width={48} 
            height={48} 
            className="mx-auto mb-4"
          />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show security error
  if (securityError || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Image 
            src="/6-dots-spinner.svg" 
            alt="Loading..." 
            width={48} 
            height={48} 
            className="mx-auto mb-4"
          />
          <p className="text-gray-600">Authentication in progress...</p>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
