/**
 * Test API Connection
 * Simple script to test if frontend can reach Python backend
 */

import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-config'

export async function testBackendConnection() {
  try {
    console.log('Testing backend connection...')
    console.log('Backend URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    
    // Test health endpoint
    const health = await apiClient.get(API_ENDPOINTS.system.health)
    console.log('✅ Backend is healthy:', health)
    
    return { success: true, data: health }
  } catch (error) {
    console.error('❌ Backend connection failed:', error)
    return { success: false, error }
  }
}

export async function testAuthEndpoint(email: string, password: string, role: 'admin' | 'agent') {
  try {
    console.log('Testing auth endpoint...')
    
    const response = await apiClient.post(API_ENDPOINTS.auth.signin, {
      email,
      password,
      role
    })
    
    console.log('✅ Auth successful:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('❌ Auth failed:', error)
    return { success: false, error }
  }
}
