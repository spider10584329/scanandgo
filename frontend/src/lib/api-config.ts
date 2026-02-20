/**
 * API Configuration
 * Base URL and endpoint definitions for Python FastAPI backend
 */

// Use empty string for Next.js proxy in production/deployment
// The Next.js server will proxy /api requests to the backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    signin: '/api/signin',
    verifyToken: '/api/verify-token',
    registerUser: '/api/register-user',
    passwordReset: '/api/password-reset',
    checkUsername: '/api/check-username',
    checkAdminEmail: '/api/check-admin-email',
  },

  // Inventory Management
  inventories: {
    list: '/api/inventories',
    create: '/api/inventories',
    update: (id: number) => `/api/inventories/${id}`,
    delete: (id: number) => `/api/inventories/${id}`,
    move: '/api/inventories/move',
    statusSummary: '/api/inventories/status-summary',
    count: '/api/inventories/count',
    recentActivity: '/api/inventories/recent-activity',
    locationAnalytics: '/api/inventories/location-analytics',
  },

  // Items
  items: {
    list: '/api/items',
    create: '/api/items',
    update: '/api/items',
    delete: '/api/items',
    count: '/api/items/count',
  },

  // Categories
  categories: {
    list: '/api/categories',
    create: '/api/categories',
    update: '/api/categories',
    delete: '/api/categories',
    count: '/api/categories/count',
  },

  // Users/Operators
  users: {
    list: '/api/users',
    get: (id: number) => `/api/users/${id}`,
    update: (id: number) => `/api/users/${id}`,
    delete: (id: number) => `/api/users/${id}`,
    resetPassword: (id: number) => `/api/users/${id}/reset-password`,
    count: '/api/users/count',
  },

  // Location Management
  buildings: {
    list: '/api/buildings',
    create: '/api/buildings',
    update: '/api/buildings',
    delete: '/api/buildings',
  },

  areas: {
    list: '/api/areas',
    create: '/api/areas',
    update: '/api/areas',
    delete: '/api/areas',
  },

  floors: {
    list: '/api/floors',
    create: '/api/floors',
    update: '/api/floors',
    delete: '/api/floors',
  },

  detailLocations: {
    list: '/api/detail-locations',
    create: '/api/detail-locations',
    update: '/api/detail-locations',
    delete: '/api/detail-locations',
    count: '/api/locations/count',
  },

  // Analytics
  analytics: {
    search: '/api/search',
    duplicates: '/api/duplicates',
    missingItems: '/api/missing-items',
    missingItemsCount: '/api/missing-items/count',
    breakageCount: '/api/breakage/count',
  },

  // Snapshots
  snapshots: {
    list: '/api/snapshots',
    create: '/api/snapshots',
    get: (id: number) => `/api/snapshots/${id}`,
    update: (id: number) => `/api/snapshots/${id}`,
    delete: (id: number) => `/api/snapshots/${id}`,
  },

  // System
  system: {
    init: '/api/init',
    health: '/health',
    alerts: '/api/system/alerts',
  },

  // Admin
  admin: {
    generateApiKey: '/api/admin/generate-apikey',
    getApiKey: '/api/admin/get-apikey',
  },

  // Client
  client: {
    get: '/api/client',
    update: '/api/client',
  },

  // ScanAndGo
  scanandgo: {
    inventory: '/api/scanandgo/inventory',
  },

  // Mobile Device Management (Agents)
  agents: {
    list: '/api/agents/list',
    register: '/api/agents/register',
    delete: (agentsId: number) => `/api/agents/${agentsId}`,
  },
} as const
