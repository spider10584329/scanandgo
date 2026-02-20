/**
 * API Client
 * Centralized HTTP client for communicating with Python FastAPI backend
 */

import { API_BASE_URL } from './api-config'

interface RequestOptions extends RequestInit {
  token?: string
  params?: Record<string, string | number | boolean | undefined>
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class APIClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseURL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, params, ...fetchOptions } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Auto-add token from localStorage if not provided
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null)
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const url = this.buildURL(endpoint, params)

    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`)
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Include cookies for CORS
      })

      // Parse response
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        const errorMessage = typeof data === 'object' 
          ? (data.error || data.message || data.detail || 'Request failed')
          : data || 'Request failed'
        
        console.error('[API Error]', {
          url,
          status: response.status,
          error: errorMessage,
          data
        })
        
        throw new APIError(
          errorMessage,
          response.status,
          data
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      // Network or other errors
      console.error('[API Network Error]', error)
      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL)

// Export for custom instances if needed
export { APIClient }
