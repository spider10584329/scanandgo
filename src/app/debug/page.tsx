'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [token, setToken] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; payload?: { userId: number; username: string; role: string; isActive: boolean } } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('auth-token')
    setToken(storedToken)
    
    if (storedToken) {
      // Test token verification
      fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: storedToken }),
      })
      .then(response => response.json())
      .then(data => {
        setVerificationResult(data)
      })
      .catch(err => {
        console.error('Debug: Token verification error:', err)
        setError(err.message)
      })
    }
  }, [])

  const testLogin = async () => {
    try {
      const response = await fetch('/api/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'agent1',
          password: 'password123'
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.token) {
        localStorage.setItem('auth-token', data.token)
        setToken(data.token)
        alert('Login successful, token stored!')
      } else {
        alert('Login failed: ' + data.message)
      }
    } catch (err) {
      console.error('Debug: Login error:', err)
      alert('Login error: ' + err)
    }
  }

  const clearToken = () => {
    localStorage.removeItem('auth-token')
    setToken(null)
    setVerificationResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Current Token:</h2>
            <p className="text-sm text-gray-600 break-all">
              {token || 'No token found'}
            </p>
          </div>
          
          {verificationResult && (
            <div>
              <h2 className="text-lg font-semibold">Token Verification:</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(verificationResult, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <div>
              <h2 className="text-lg font-semibold text-red-600">Error:</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Login (agent1)
            </button>
            
            <button
              onClick={clearToken}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Token
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Test Navigation:</h2>
            <div className="flex gap-4 mt-2">
              <a href="/agent" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Agent Portal
              </a>
              <a href="/admin" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Admin Portal
              </a>
              <a href="/agent/dashboard" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Agent Dashboard
              </a>
              <a href="/admin/dashboard" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
