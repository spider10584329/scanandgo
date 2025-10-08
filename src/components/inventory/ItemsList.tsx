'use client'

import { useState, useEffect, useCallback } from 'react'

interface Item {
  id: number
  name: string
  barcode?: string
  category_id?: number
}

interface Category {
  id: number
  name: string
}

interface ItemsListProps {
  selectedCategory: Category | null
}

export default function ItemsList({ selectedCategory }: ItemsListProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const url = selectedCategory 
        ? `/api/items?category_id=${selectedCategory.id}`
        : '/api/items'

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.items) {
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleItemToggle = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 ">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Items</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {items.length} items
        </span>
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-1 h-[calc(100vh-380px)] overflow-y-auto">
          {items.map((item) => {
            const isSelected = selectedItems.has(item.id)
            return (
              <div 
                key={item.id} 
                className={`flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors duration-150 ${
                  isSelected ? 'bg-gray-100' : 'bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 bg-transparent border border-gray-400 checked:border-gray-500 appearance-none"
                      checked={isSelected}
                      onChange={() => handleItemToggle(item.id)}
                    />
                    {isSelected && (
                      <svg className="absolute inset-0 w-4 h-4 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm">No items found</p>
          <p className="text-xs">
            {selectedCategory 
              ? `No items in category "${selectedCategory.name}"`
              : 'No items available'
            }
          </p>
        </div>
      )}
    </div>
  )
}
