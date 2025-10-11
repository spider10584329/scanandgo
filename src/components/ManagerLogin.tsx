'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toastSuccess, toastError } from './ui/toast'
import { useAuthContext } from '@/contexts/AuthContext'

export default function ManagerLogin() {
  const router = useRouter()
  const { login } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    
    try {
      // Call local admin-login API which handles PulsePoint authentication and token generation
      const response = await axios.post('/api/admin-login', {
        email,
        password
      })
      
      if (response.data.success && response.data.token) {
        const loginSuccess = await login(response.data.token)
        
        if (loginSuccess) {
          toastSuccess('Login successful! Redirecting...')
          
          // Clear form after successful login
          setEmail('')
          setPassword('')
          
          // Redirect to admin area
          setTimeout(() => {
            router.push('/admin')
          }, 1500)
        } else {
          toastError('Login validation failed. Please try again.')
        }
      } else {
        toastError(response.data.message || 'Login failed')
      }
      
    } catch (error: unknown) { 
      console.error('Login Error:', error)
      toastError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3 ">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-center mb-2">
          <p className="text-sm text-gray-500 ">
            Log in to your PulsePoint account
          </p>
        </div>
        <div>
          <label htmlFor="email" className="block text-xs text-gray-700 mb-1 font-bold">
            Email:
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          disabled={isLoading}
          className="w-full mt-2 py-2 px-4 bg-black text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      
    </div>
  )
}
