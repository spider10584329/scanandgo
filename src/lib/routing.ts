/**
 * Get the appropriate section URL for navigation
 */
export function getSectionUrl(section: string): string {
  switch (section) {
    case 'inventory':
      return '/inventory'
    case 'items':
      return '/items'
    case 'reports':
      return '/reports'
    case 'settings':
      return '/settings'
    default:
      return '/'
  }
}

/**
 * Get the default application URL
 */
export function getDefaultUrl(): string {
  return '/' // Main application page
}
