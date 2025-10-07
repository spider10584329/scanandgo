'use client'

import { useState, useEffect } from 'react'
import { toastError } from '../ui/toast'

export default function InventoryPane() {
  const [inventoryCount, setInventoryCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchInventoryCount = async () => {

        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          toastError('No authentication token found')
        }
        
        const response = await fetch('/api/inventories/count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })       
        
        const data = await response.json()
        setInventoryCount(data.count)
       
    
    }
    fetchInventoryCount()
  }, []) 

  const getDisplayCount = () => {  
    return inventoryCount !== null && inventoryCount !== undefined ? inventoryCount.toLocaleString() : '0'
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">INVENTORY</h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Number of inventories</p>
        <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-[#029b68]">
          {getDisplayCount()}
        </span>
      </div>
    </div>
  )
}
