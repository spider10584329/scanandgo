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
      logout()
      router.push('/')
      return
    }

    if (user.role !== requiredRole) {
      setSecurityError(`Insufficient permissions: ${user.role} cannot access ${requiredRole} content`)
      console.warn(`Security Alert: User ${user.userId} (${user.role}) attempted to access ${requiredRole} content at ${pathname}`)
      logout()
      router.push('/')
      return
    }

    if (!user.isActive) {
      setSecurityError('Account is inactive')
      logout()
      router.push('/')
      return
    }

    // Check if current path is allowed for this role
    const basePath = `/${requiredRole}`
    if (!pathname.startsWith(basePath)) {
      setSecurityError('Invalid path for role')
      console.warn(`Security Alert: Invalid path access attempt by ${user.role} user to ${pathname}`)
      router.push(`${basePath}/dashboard`)
      return
    }

    // Additional path restrictions if specified
    if (allowedPaths && !allowedPaths.some(path => pathname.startsWith(path))) {
      setSecurityError('Path not allowed for this user')
      console.warn(`Security Alert: Restricted path access attempt by user ${user.userId} to ${pathname}`)
      router.push(`${basePath}/dashboard`)
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
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{securityError || 'You do not have permission to access this page.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
