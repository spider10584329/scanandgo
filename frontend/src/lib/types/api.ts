/**
 * API Response Types
 * Type definitions for API responses from Python FastAPI backend
 */

// Common response types
export interface SuccessResponse {
  success: true
  message?: string
}

export interface ErrorResponse {
  success: false
  error: string
  details?: string
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Authentication
export interface SignInRequest {
  email: string
  password: string
  role: 'admin' | 'agent'
}

export interface TokenResponse {
  success: true
  message: string
  token: string
  user: {
    customerId: number
    id: number
    username: string
    email?: string
    role: 'admin' | 'agent'
  }
}

export interface TokenPayload {
  customerId: number
  userId: number
  username: string
  email?: string
  role: 'admin' | 'agent'
  isActive: boolean
  iat?: number
  exp?: number
}

export interface VerifyTokenResponse {
  valid: boolean
  payload?: TokenPayload
  error?: string
}

// Inventory
export interface Inventory {
  id: number
  customer_id: number
  category_id?: number
  item_id?: number
  building_id?: number
  area_id?: number
  floor_id?: number
  detail_location_id?: number
  barcode?: string
  status?: number
  reg_date?: string
  inv_date?: string
  purchase_date?: string
  purchase_amount?: number
  comment?: string
  is_throw?: boolean
  items?: Item
  categories?: Category
  buildings?: Building
  areas?: Area
  floors?: Floor
  detail_locations?: DetailLocation
}

export interface InventoryStatusSummary {
  active: number
  maintenance: number
  inactive: number
  missing: number
  total: number
}

// Items
export interface Item {
  id: number
  customer_id: number
  category_id?: number
  name: string
  barcode?: string
  category?: Category
}

// Category
export interface Category {
  id: number
  customer_id: number
  name: string
}

// Locations
export interface Building {
  id: number
  customer_id: number
  name: string
}

export interface Area {
  id: number
  customer_id: number
  building_id?: number
  name: string
}

export interface Floor {
  id: number
  customer_id: number
  area_id?: number
  name: string
}

export interface DetailLocation {
  id: number
  customer_id: number
  floor_id?: number
  name: string
  img_data?: string
}

// Users/Operators
export interface Operator {
  id: number
  customer_id: number
  username: string
  isActive: number
  isPasswordRequest?: number
}

// Analytics
export interface SearchResult {
  id: number
  itemName: string
  barcode: string
  location: string
  status: string
  statusColor: string
  isThrow: string
  deploymentDate: string
  category: string
}

export interface MissingItem {
  id: number
  customer_id: number
  detail_location_id: number
  barcode?: string
}

// Snapshots
export interface Snapshot {
  id: number
  customer_id: number
  name?: string
  date?: string
}
