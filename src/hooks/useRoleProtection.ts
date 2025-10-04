'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UseRoleProtectionOptions {
  allowedRoles: string[]
  redirectPath?: string
  requireAuth?: boolean
}

interface UseRoleProtectionResult {
  isLoading: boolean
  isAuthorized: boolean
  session: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function useRoleProtection({ 
  allowedRoles, 
  redirectPath = '/auth/signin',
  requireAuth = true 
}: UseRoleProtectionOptions): UseRoleProtectionResult {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    // Check if authentication is required
    if (requireAuth && !session) {
      console.log(`🚫 Access denied: No session found, redirecting to ${redirectPath}`)
      router.push(redirectPath)
      return
    }

    // Check if user has required role
    if (session && allowedRoles.length > 0) {
      const userRole = (session.user as any)?.role // eslint-disable-line @typescript-eslint/no-explicit-any
      const hasPermission = allowedRoles.includes(userRole || '')

      if (!hasPermission) {
        console.log(`🚫 Access denied: User ${session.user?.email} (${userRole}) attempted to access page requiring roles: ${allowedRoles.join(', ')}`)
        
        // Redirect to appropriate home page based on user's actual role
        switch (userRole) {
          case 'admin':
            router.push('/admin')
            break
          case 'manager':
            router.push('/manager')
            break
          case 'agent':
            router.push('/agent')
            break
          case 'user':
            router.push('/user')
            break
          default:
            router.push('/auth/signin')
        }
        return
      }

      console.log(`✅ Access granted: User ${session.user?.email} (${userRole}) has permission`)
      setIsAuthorized(true)
    } else if (!requireAuth) {
      // If auth not required, authorize
      setIsAuthorized(true)
    }
  }, [session, status, allowedRoles, redirectPath, requireAuth, router])

  return {
    isLoading: status === 'loading' || (requireAuth && (!session || !isAuthorized)),
    isAuthorized,
    session
  }
}


