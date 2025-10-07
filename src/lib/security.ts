import { verifyToken } from './jwt'

export interface SecurityContext {
  userId: string | number
  role: 'admin' | 'agent'
  isActive: boolean
  username?: string
}

/**
 * Verify user has the required role and is authorized for the current route
 */
export async function verifyRoleAccess(
  token: string | undefined,
  requiredRole: 'admin' | 'agent',
  currentPath?: string
): Promise<SecurityContext | null> {
  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    // Check if user is active
    if (!payload.isActive) {
      return null
    }

    // Check role match
    if (payload.role !== requiredRole) {
      return null
    }

    // Log security event for suspicious activity
    if (currentPath && payload.role !== requiredRole) {
      console.warn(`Security Alert: User ${payload.userId} (${payload.role}) attempted to access ${requiredRole} route: ${currentPath}`)
    }

    return {
      userId: payload.userId,
      role: payload.role,
      isActive: payload.isActive,
      username: payload.username
    }
  } catch (error) {
    console.error('Security verification error:', error)
    return null
  }
}

/**
 * Redirect to appropriate page based on role
 */
export function getRedirectPath(role: 'admin' | 'agent'): string {
  return role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'
}

/**
 * Get the base path for a role
 */
export function getRoleBasePath(role: 'admin' | 'agent'): string {
  return `/${role}`
}

/**
 * Check if a path is valid for a specific role
 */
export function isValidRolePath(path: string, role: 'admin' | 'agent'): boolean {
  const basePath = getRoleBasePath(role)
  return path.startsWith(basePath)
}

/**
 * Security headers for enhanced protection
 */
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
