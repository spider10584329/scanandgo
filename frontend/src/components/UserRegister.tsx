'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { toastSuccess, toastError } from './ui/toast'
import { useAuthContext } from '@/contexts/AuthContext'

interface UserRegisterProps {
  onBackToLogin: () => void
}

export default function UserRegister({ onBackToLogin }: UserRegisterProps) {
  const { clearStaleTokens } = useAuthContext()
  const [adminEmail, setAdminEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Clear any stale tokens when starting registration
  useEffect(() => {
    clearStaleTokens()
  }, [clearStaleTokens])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)    
  
    if (password !== confirmPassword) {
      toastError('Passwords do not match!')
      setIsLoading(false)
      return
    }
    
    try {
      // Check if admin email exists via server-side API (keeps credentials secure)
      console.log('[UserRegister] Checking admin email via server API')
      const adminCheckResponse = await axios.post('/api/check-admin-email', {
        email: adminEmail
      })

      if (!adminCheckResponse.data.exists) {
        toastError('Administrator address does not exist.')
        setIsLoading(false)
        return
      }
      const customerId = adminCheckResponse.data.customerId

      if (!customerId) {
        toastError('Could not retrieve customer ID from administrator account.')
        setIsLoading(false)
        return
      }
      // Check if username already exists in local database
      console.log('[UserRegister] Checking username availability:', username)
      try {
        const usernameCheckResponse = await axios.post('/api/check-username', {
          username: username
        })
        
        console.log('[UserRegister] Username check response:', usernameCheckResponse.data)
        
        if (usernameCheckResponse.data.exists) {
          toastError('Account already exists.')
          setIsLoading(false)
          return
        }
      } catch (dbError: unknown) {
        console.error('[UserRegister] Username check error:', dbError)
        
        // Provide more specific error message
        let errorMsg = 'Failed to check username availability.'
        if (dbError && typeof dbError === 'object' && 'response' in dbError) {
          const axiosError = dbError as { response?: { data?: { error?: string } } }
          if (axiosError.response?.data?.error) {
            errorMsg = `Database Error: ${axiosError.response.data.error}`
          }
        }
        
        toastError(errorMsg)
        setIsLoading(false)
        return
      }
      
      // Register the new user in local MariaDB
      console.log('[UserRegister] Registering user:', { username, customerId })
      try {
        const registrationResponse = await axios.post('/api/register-user', {
          username,
          password,
          customer_id: customerId
        })
        
        console.log('[UserRegister] Registration response:', registrationResponse.data)
        
        if (registrationResponse.data.success) {
          toastSuccess('Registration successful! Account pending approval.')
          // Clear form after successful registration
          setAdminEmail('')
          setUsername('')
          setPassword('')
          setConfirmPassword('')
          // Go back to login after a delay
          setTimeout(() => {
            onBackToLogin()
          }, 2000)
        } else {
          toastError(registrationResponse.data.message || 'Registration failed.')
        }
      } catch (regError: unknown) {
        console.error('[UserRegister] Registration error:', regError)
        
        // Provide more specific error message
        let errorMsg = 'Failed to register user.'
        if (regError && typeof regError === 'object' && 'response' in regError) {
          const axiosError = regError as { response?: { data?: { error?: string } } }
          if (axiosError.response?.data?.error) {
            errorMsg = `Registration Error: ${axiosError.response.data.error}`
          }
        }
        
        toastError(errorMsg)
      }
      
    } catch (error: unknown) {
      console.error('API Error:', error)
      let errorMessage = 'Failed to connect to server'
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
        errorMessage = 'Network Error: Cannot connect to server.'
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; statusText?: string } }
        if (axiosError.response?.status) {
          errorMessage = `Server Error: ${axiosError.response.status} - ${axiosError.response.statusText}`
        }
      }
      
      toastError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3 mt-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="adminEmail" className="block text-xs text-gray-700 mb-1 font-bold">
            Manager Email:
          </label>
          <input
            id="adminEmail"
            type="email"
            placeholder="Manager Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:shadow-md"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-xs text-gray-700 mb-1 font-bold">
            User Name:
          </label>
          <input
            id="username"
            type="text"
            placeholder="User Name"
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

        <div>
          <label htmlFor="confirmPassword" className="block text-xs text-gray-700 mb-1 font-bold">
            Confirm Password:
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:shadow-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2 px-4 bg-black text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  )
}
