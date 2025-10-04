import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Log access attempts for debugging
    console.log(`🔐 Middleware: ${req.nextUrl.pathname} - User: ${req.nextauth.token?.email} - Role: ${req.nextauth.token?.role}`)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const userRole = token?.role as string
        const userEmail = token?.email as string

        // Allow access to public routes
        if (
          req.nextUrl.pathname.startsWith('/auth') ||
          req.nextUrl.pathname === '/' ||
          req.nextUrl.pathname.startsWith('/api/auth') ||
          req.nextUrl.pathname.startsWith('/api/init')
        ) {
          return true
        }

        // Require authentication for all protected routes
        if (!token || !userRole) {
          console.log(`❌ Access denied: No valid token for ${pathname}`)
          return false
        }

        // Comprehensive role-based access control
        
        // Admin routes - Only admins can access
        if (pathname.startsWith('/admin')) {
          const hasAccess = userRole === 'admin'
          if (!hasAccess) {
            console.log(`❌ Access denied: User ${userEmail} (${userRole}) attempted to access admin route: ${pathname}`)
          }
          return hasAccess
        }

        // Manager routes - Admins and managers can access
        if (pathname.startsWith('/manager')) {
          const hasAccess = ['admin', 'manager'].includes(userRole)
          if (!hasAccess) {
            console.log(`❌ Access denied: User ${userEmail} (${userRole}) attempted to access manager route: ${pathname}`)
          }
          return hasAccess
        }

        // Agent routes - Admins, managers, and agents can access
        if (pathname.startsWith('/agent')) {
          const hasAccess = ['admin', 'manager', 'agent'].includes(userRole)
          if (!hasAccess) {
            console.log(`❌ Access denied: User ${userEmail} (${userRole}) attempted to access agent route: ${pathname}`)
          }
          return hasAccess
        }

        // User routes - All authenticated users can access their own user area
        if (pathname.startsWith('/user')) {
          const hasAccess = ['admin', 'manager', 'agent', 'user'].includes(userRole)
          if (!hasAccess) {
            console.log(`❌ Access denied: User ${userEmail} (${userRole}) attempted to access user route: ${pathname}`)
          }
          return hasAccess
        }

        // Legacy dashboard route - Redirect based on role (this should be rarely used now)
        if (pathname === '/dashboard') {
          console.log(`⚠️ Legacy dashboard access by ${userEmail} (${userRole}) - should redirect to role-specific home`)
          return true // Allow access, but the page itself will redirect
        }

        // Any other protected routes - require authentication but allow all roles
        console.log(`✅ Access granted: User ${userEmail} (${userRole}) accessing: ${pathname}`)
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
