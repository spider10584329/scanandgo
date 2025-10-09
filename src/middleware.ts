import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyRoleAccess, securityHeaders, isValidRolePath } from './lib/security'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Check if accessing protected routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/agent')) {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    // Determine required role from path
    const requiredRole = pathname.startsWith('/admin') ? 'admin' : 'agent'
    
    // Verify role access
    const securityContext = await verifyRoleAccess(token, requiredRole, pathname)
    
    if (!securityContext) {
      // Log security event
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      console.warn(`Security Alert: Unauthorized access attempt to ${pathname} from IP: ${clientIP}`)
      
      // Clear any existing auth cookie and redirect
      const redirectResponse = NextResponse.redirect(new URL('/', request.url))
      redirectResponse.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
        secure: true,
        sameSite: 'strict'
      })
      
      // Add header to indicate session cleanup needed
      redirectResponse.headers.set('x-session-cleanup', 'true')
      return redirectResponse
    }

    // Double-check path validity for role (additional security layer)
    if (!isValidRolePath(pathname, securityContext.role)) {
      console.warn(`Security Alert: Cross-role path access attempt by user ${securityContext.userId} (${securityContext.role}) to ${pathname}`)
      
      // Redirect to appropriate dashboard
      const correctPath = securityContext.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'
      return NextResponse.redirect(new URL(correctPath, request.url))
    }

    // Add user context to headers for downstream use (optional)
    response.headers.set('x-user-id', String(securityContext.userId))
    response.headers.set('x-user-role', securityContext.role)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*']
}
