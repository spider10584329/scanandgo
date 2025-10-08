'use client'

import { useState, useEffect } from 'react'
import { toastError } from '../ui/toast'

export default function BreakagePane() {
  const [breakageCount, setBreakageCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchBreakageCount = async () => {
        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          toastError('No authentication token found')
        }
        
        const response = await fetch('/api/breakage/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })       
        
        const data = await response.json()
        setBreakageCount(data.count)
    }
    fetchBreakageCount()
  }, []) 

  const getDisplayCount = () => {  
    return breakageCount !== null && breakageCount !== undefined ? breakageCount.toLocaleString() : '0'
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">BREAKAGE</h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">to be throw</p>
        <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-[#ea580c]">
          {getDisplayCount()}
        </span>
      </div>
    </div>
  )
}
