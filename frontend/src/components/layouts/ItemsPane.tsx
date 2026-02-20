'use client'

import { useState, useEffect } from 'react'
import { toastError } from '../ui/toast'

export default function ItemsPane() {
  const [itemCount, setItemCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchItemCount = async () => {
        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          toastError('No authentication token found')
        }
        
        const response = await fetch('/api/items/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })       
        
        const data = await response.json()
        setItemCount(data.count)
    }
    fetchItemCount()
  }, []) 

  const getDisplayCount = () => {  
    return itemCount !== null && itemCount !== undefined ? itemCount.toLocaleString() : '0'
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow px-5 py-5  hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Items</h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm">Number of items</p>
        <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-[#0066cc]">
          {getDisplayCount()}
        </span>
      </div>
    </div>
  )
}
