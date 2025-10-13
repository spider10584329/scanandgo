'use client'

import { useState, useEffect, useCallback } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'

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
  selectedBuilding?: { id: number; name: string } | null
  selectedArea?: { id: number; name: string } | null
  selectedFloor?: { id: number; name: string } | null
  selectedDetailLocation?: { id: number; name: string } | null
  onItemsAdded?: () => void
  refreshTrigger?: number
}

export default function ItemsList({ 
  selectedCategory, 
  onDragStart, 
  selectedBuilding, 
  selectedArea, 
  selectedFloor, 
  selectedDetailLocation, 
  onItemsAdded,
  refreshTrigger
}: ItemsListProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [isInserting, setIsInserting] = useState(false)

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

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchItems()
    }
  }, [refreshTrigger, fetchItems])

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
  const hasAllLocationFilters = selectedBuilding && selectedArea && selectedFloor && selectedDetailLocation
  const canInsert = selectedItems.size > 0 && hasAllLocationFilters



  const handleInsertItems = async () => {
    if (!canInsert) {
      toastError('Please select items and ensure all location filters are set.')
      return
    }

    setIsInserting(true)

    try {
      const selectedItemsArray = items.filter(item => selectedItems.has(item.id))

      // Prepare location data
      const locationData = {
        buildingId: selectedBuilding?.id || null,
        areaId: selectedArea?.id || null,
        floorId: selectedFloor?.id || null,
        detailLocationId: selectedDetailLocation?.id || null
      }

      // Get authentication token
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      // Create inventory records
      const response = await fetch('/api/inventories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: selectedItemsArray.map((item: Item) => ({
            id: item.id,
            category_id: item.category_id
          })),
          locationData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear selections and refresh items
        setSelectedItems(new Set())
        
        // Notify parent components
        onItemsAdded?.()
        
        // Refresh items list
        await fetchItems()
        
        // Show success message
        toastSuccess(`Successfully added ${result.createdCount} items to inventory!`)
      } else {
        toastError('Failed to create inventory records: ' + result.error)
      }

    } catch (error) {
      console.error('Error inserting items:', error)
      toastError('An error occurred while adding items to inventory')
    } finally {
      setIsInserting(false)
    }
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900">Items</h3>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {selectedItems.size > 0 && hasAllLocationFilters ? (
            <button
              onClick={handleInsertItems}
              disabled={isInserting}
              className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors"
              title="Insert selected items to inventory"
            >
              {isInserting ? 'Inserting...' : `${selectedItems.size} selected`}
            </button>
          ) : selectedItems.size > 0 ? (
            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {selectedItems.size} selected
            </span>
          ) : null}
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            {items.length} items
          </span>
        </div>
      </div>
      
      {items.length > 0 ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-1 sm:space-y-1.5">
            {items.map((item) => {
              const isSelected = selectedItems.has(item.id)
              return (
                <div 
                  key={item.id} 
                  draggable={canDrag}
                  onDragStart={canDrag ? handleDragStart : undefined}
                  className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all duration-150 ${
                    isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white'
                  } ${canDrag ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                    {isSelected && canDrag && (
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                      </svg>
                    )}
                    <span className="text-xs sm:text-sm text-gray-900 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0 ml-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-transparent border border-gray-400 checked:border-gray-500 appearance-none"
                        checked={isSelected}
                        onChange={() => handleItemToggle(item.id)}
                      />
                      {isSelected && (
                        <svg className="absolute inset-0 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <div>
            <svg className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>          
            <p className="text-xs">
              {selectedCategory 
                ? `No items available in category "${selectedCategory.name}"`
                : 'No items available'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
