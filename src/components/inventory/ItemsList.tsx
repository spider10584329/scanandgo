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
  onDragStart?: (items: Item[]) => void
}

export default function ItemsList({ selectedCategory, onDragStart }: ItemsListProps) {
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

      // Fetch all items
      const url = selectedCategory 
        ? `/api/items?category_id=${selectedCategory.id}`
        : '/api/items'

      const itemsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!itemsResponse.ok) {
        throw new Error(`HTTP error! status: ${itemsResponse.status}`)
      }

      const itemsData = await itemsResponse.json()
      
      // Fetch inventory items to get registered barcodes
      const inventoryResponse = await fetch('/api/inventories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let registeredBarcodes = new Set<string>()
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        if (inventoryData.success && inventoryData.inventories) {
          registeredBarcodes = new Set(
            inventoryData.inventories
              .map((inv: { barcode?: string }) => inv.barcode)
              .filter((barcode: string | undefined): barcode is string => !!barcode) // Remove null/empty barcodes
          )
        }
      }

      if (itemsData.success && itemsData.items) {
        // Filter out items that are already registered in inventory
        const availableItems = itemsData.items.filter((item: Item) => 
          !item.barcode || !registeredBarcodes.has(item.barcode)
        )
        setItems(availableItems)
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const selectedItemsArray = items.filter(item => selectedItems.has(item.id))
    
    if (selectedItemsArray.length === 0) {
      e.preventDefault()
      return
    }

    // Store the selected items data for the drop handler
    e.dataTransfer.setData('application/json', JSON.stringify(selectedItemsArray))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create a visual drag preview showing the actual items
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'absolute'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = '280px'
    dragPreview.style.background = 'white'
    dragPreview.style.border = '2px solid #3b82f6'
    dragPreview.style.borderRadius = '8px'
    dragPreview.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
    dragPreview.style.padding = '12px'
    dragPreview.style.maxHeight = '200px'
    dragPreview.style.overflow = 'hidden'
    
    // Add header
    const header = document.createElement('div')
    header.style.fontSize = '12px'
    header.style.fontWeight = 'bold'
    header.style.color = '#3b82f6'
    header.style.marginBottom = '8px'
    header.style.borderBottom = '1px solid #e5e7eb'
    header.style.paddingBottom = '6px'
    header.textContent = `Moving ${selectedItemsArray.length} item${selectedItemsArray.length > 1 ? 's' : ''}`
    dragPreview.appendChild(header)
    
    // Add items (show up to 3 items, then "and X more")
    const itemsToShow = selectedItemsArray.slice(0, 3)
    itemsToShow.forEach((item) => {
      const itemDiv = document.createElement('div')
      itemDiv.style.display = 'flex'
      itemDiv.style.alignItems = 'center'
      itemDiv.style.justifyContent = 'space-between'
      itemDiv.style.padding = '6px 8px'
      itemDiv.style.marginBottom = '4px'
      itemDiv.style.backgroundColor = '#eff6ff'
      itemDiv.style.border = '1px solid #bfdbfe'
      itemDiv.style.borderRadius = '4px'
      itemDiv.style.fontSize = '13px'
      
      const itemName = document.createElement('span')
      itemName.style.color = '#1f2937'
      itemName.style.fontWeight = '500'
      itemName.textContent = item.name
      
      const checkIcon = document.createElement('div')
      checkIcon.innerHTML = '✓'
      checkIcon.style.color = '#3b82f6'
      checkIcon.style.fontWeight = 'bold'
      checkIcon.style.fontSize = '12px'
      
      itemDiv.appendChild(itemName)
      itemDiv.appendChild(checkIcon)
      dragPreview.appendChild(itemDiv)
    })
    
    // Add "and X more" if there are more items
    if (selectedItemsArray.length > 3) {
      const moreDiv = document.createElement('div')
      moreDiv.style.textAlign = 'center'
      moreDiv.style.padding = '6px'
      moreDiv.style.fontSize = '12px'
      moreDiv.style.color = '#6b7280'
      moreDiv.style.fontStyle = 'italic'
      moreDiv.textContent = `and ${selectedItemsArray.length - 3} more item${selectedItemsArray.length - 3 > 1 ? 's' : ''}...`
      dragPreview.appendChild(moreDiv)
    }
    
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, 140, 100)
    
    // Clean up after drag
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview)
      }
    }, 0)
    
    // Call parent handler if provided
    onDragStart?.(selectedItemsArray)
  }

  const canDrag = selectedItems.size > 0

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
        <div className="flex items-center space-x-2">
          {selectedItems.size > 0 && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {selectedItems.size} selected
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {items.length} items
          </span>
        </div>
      </div>
      
     
      
      {items.length > 0 ? (
        <div className="space-y-1 h-[calc(100vh-380px)] overflow-y-auto">
          {items.map((item) => {
            const isSelected = selectedItems.has(item.id)
            return (
              <div 
                key={item.id} 
                draggable={canDrag}
                onDragStart={canDrag ? handleDragStart : undefined}
                className={`flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all duration-150 ${
                  isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white'
                } ${canDrag ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  {isSelected && canDrag && (
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                    </svg>
                  )}
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
          <p className="text-xs">
            {selectedCategory 
              ? `No items available in category "${selectedCategory.name}"`
              : 'No items available'
            }
          </p>
        </div>
      )}
    </div>
  )
}
