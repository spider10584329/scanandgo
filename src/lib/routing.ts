/**
 * Get the appropriate dashboard URL for a user role
 */
export function getRoleHomeUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'manager':
      return '/manager'
    case 'agent':
      return '/agent'
    case 'user':
      return '/user'
    default:
      return '/auth/signin'
  }
}

export function getRoleDashboardUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'manager':
      return '/manager/dashboard'
    case 'agent':
      return '/agent/dashboard'
    case 'user':
      return '/user/dashboard'
    default:
      return '/auth/signin'
  }
}

/**
 * Get the default dashboard URL (for general redirects when no role is specified)
 */
export function getDefaultDashboardUrl(): string {
  return '/dashboard' // This will handle role-based redirection
}
