'use client'

import { useState } from 'react'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import { toastSuccess, toastError } from './ui/toast'

export default function ManagerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Call external pulsepoint API directly for admin authentication
      const response = await axios.post('https://api.pulsepoint.myrfid.nc/api/user/project/signin', {
        username: email,
        password: password,
        projectId: 7
      })
      
      if (response.data.status === 1) {
        toastSuccess('Login successful!')
        // Clear form after successful login
        setEmail('')
        setPassword('')
      } else if (response.data.status === -1) {
        toastError(response.data.message || 'Account not found')
      } else if (response.data.status === 0) {
        toastError(response.data.message || 'Wrong password')
      } else {
        toastError('Login failed')
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
      
      {/* Toast notifications container */}
      <Toaster />
    </div>
  )
}
