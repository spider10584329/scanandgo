'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserRegister from './UserRegister'
import axios from 'axios'
import { toastSuccess, toastError } from './ui/toast'
import { useAuthContext } from '@/contexts/AuthContext'

export default function UserLogin() {
  const router = useRouter()
  const { login } = useAuthContext()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await axios.post('/api/signin', {
        email: username,
        password,
        role: 'agent'
      })
      
      if (response.data.success && response.data.token) {
        const loginSuccess = await login(response.data.token)
        
        if (loginSuccess) {
          toastSuccess('Login successful! Redirecting...')
          
          // Clear form after successful login
          setUsername('')
          setPassword('')
          
          // Redirect to agent dashboard directly
          setTimeout(() => {
            router.push('/agent/dashboard')
          }, 1000)
        } else {
          toastError('Login validation failed. Please try again.')
        }
      } else {
        toastError(response.data.message || 'Login failed. Please check your credentials.')
      }

    } catch (error: unknown) {
      console.error('Login error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string; message?: string } } }
        const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message
        toastError(detail || 'Login failed. Please check your credentials.')
      } else if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ERR_NETWORK') {
        toastError('Failed to connect to server. Please try again later.')
      } else {
        toastError('Failed to connect to server')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterRedirect = () => {
    setShowRegister(true)
  }

  const handleBackToLogin = () => {
    setShowRegister(false)
  }

  const handlePasswordReset = async () => {
    if (!username.trim()) {
      toastError('Please enter your username first.')
      return
    }

    setIsResettingPassword(true)

    try {
      const response = await axios.post('/api/password-reset-request', {
        username: username.trim()
      })

      if (response.data.success) {
        toastSuccess('Password reset request submitted successfully. Please contact your administrator.')
      } else {
        switch (response.data.code) {
          case 'USER_NOT_FOUND':
            toastError('This account is not registered.')
            break
          default:
            toastError(response.data.message || 'Password reset request failed.')
        }
      }

    } catch (error: unknown) {
      console.error('Password reset error:', error)
      let errorMessage = 'Failed to submit password reset request'

      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
        errorMessage = 'Network Error: Cannot connect to server.'
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; statusText?: string; data?: { message?: string } } }
        if (axiosError.response?.status) {
          errorMessage = `Server Error: ${axiosError.response.status} - ${axiosError.response.statusText}`
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      }

      toastError(errorMessage)
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (showRegister) {
    return <UserRegister onBackToLogin={handleBackToLogin} />
  }

  return (
    <div className="space-y-3 mt-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="username" className="block text-xs text-gray-700 mb-1 font-bold">
            Username:
          </label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:shadow-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-xs text-gray-700 mb-1 font-bold">
            Password:
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:shadow-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || isResettingPassword}
          className="w-full mt-2 py-2 px-4 bg-black text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in...' : 'Submit'}
        </button>
      </form>

      {/* Password Reset Section */}
      <div className="text-center">
        <button
          onClick={handlePasswordReset}
          disabled={isLoading || isResettingPassword}
          className="text-xs text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResettingPassword ? 'Submitting request...' : 'Forgot Password?'}
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Don&apos;t have an account?{' '}
          <button
            onClick={handleRegisterRedirect}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
   
  )
}
