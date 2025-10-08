'use client'

import { useState, useEffect } from 'react'
import { toastError } from '../ui/toast'

export default function MissingPane() {
  const [missingCount, setMissingCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchMissingCount = async () => {
        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          toastError('No authentication token found')
        }
        
        const response = await fetch('/api/missing-items/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })       
        
        const data = await response.json()
        setMissingCount(data.count)
    }
    fetchMissingCount()
  }, []) 

  const getDisplayCount = () => {  
    return missingCount !== null && missingCount !== undefined ? missingCount.toLocaleString() : '0'
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">LOST</h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">not seen since 6m</p>
        <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-[#dc2626]">
          {getDisplayCount()}
        </span>
      </div>
    </div>
  )
}
