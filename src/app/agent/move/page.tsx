'use client'

import { useState } from 'react'
import LocationSelect from '@/components/inventory/LocationSelect'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface LocationData {
  id: number
  name: string
}

interface InventoryItem {
  id: number
  purchase_date?: string
  last_date?: string
  ref_client?: string
  status?: number
  reg_date?: string
  inv_date?: string
  comment?: string
  rfid?: string
  barcode?: string
  operator_id?: number
  room_assignment?: string
  category_df_immonet?: string
  purchase_amount?: number
  is_throw?: boolean
  // Relations
  items?: {
    id: number
    name: string
    barcode?: string
  }
  categories?: {
    id: number
    name: string
  }
  buildings?: {
    id: number
    name: string
  }
  areas?: {
    id: number
    name: string
  }
  floors?: {
    id: number
    name: string
  }
  detail_locations?: {
    id: number
    name: string
  }
}

export default function MovePage() {
  // From location state
  const [fromBuilding, setFromBuilding] = useState<LocationData | null>(null)
  const [fromArea, setFromArea] = useState<LocationData | null>(null)
  const [fromFloor, setFromFloor] = useState<LocationData | null>(null)
  const [fromDetailLocation, setFromDetailLocation] = useState<LocationData | null>(null)

  // To location state
  const [toBuilding, setToBuilding] = useState<LocationData | null>(null)
  const [toArea, setToArea] = useState<LocationData | null>(null)
  const [toFloor, setToFloor] = useState<LocationData | null>(null)
  const [toDetailLocation, setToDetailLocation] = useState<LocationData | null>(null)

  // Inventory state
  const [fromInventory, setFromInventory] = useState<InventoryItem[]>([])
  const [toInventory, setToInventory] = useState<InventoryItem[]>([])
  const [selectedFromItems, setSelectedFromItems] = useState<Set<number>>(new Set())
  const [selectedToItems, setSelectedToItems] = useState<Set<number>>(new Set())
  const [isDragOverFrom, setIsDragOverFrom] = useState(false)
  const [isDragOverTo, setIsDragOverTo] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDirection, setDragDirection] = useState<'to-from' | 'from-to' | null>(null)
  
  // Search state
  const [fromBarcodeSearch, setFromBarcodeSearch] = useState<string>('')
  const [toBarcodeSearch, setToBarcodeSearch] = useState<string>('')



  // From location handlers
  const handleFromBuildingSelect = (building: LocationData | null) => {
    setFromBuilding(building)
    setFromArea(null)
    setFromFloor(null)
    setFromDetailLocation(null)
    setFromInventory([]) // Clear inventory when location changes
    setSelectedFromItems(new Set())
  }

  const handleFromAreaSelect = (area: LocationData | null) => {
    setFromArea(area)
    setFromFloor(null)
    setFromDetailLocation(null)
    setFromInventory([]) // Clear inventory when location changes
    setSelectedFromItems(new Set())
  }

  const handleFromFloorSelect = (floor: LocationData | null) => {
    setFromFloor(floor)
    setFromDetailLocation(null)
    setFromInventory([]) // Clear inventory when location changes
    setSelectedFromItems(new Set())
  }

  const handleFromDetailLocationSelect = (detailLocation: LocationData | null) => {
    setFromDetailLocation(detailLocation)
    // Auto-load inventory when all location levels are selected
    if (detailLocation && fromBuilding && fromArea && fromFloor) {
      // Pass current values directly to avoid state update delay
      loadFromInventoryWithParams(fromBuilding, fromArea, fromFloor, detailLocation)
    } else {
      setFromInventory([])
      setSelectedFromItems(new Set())
    }
  }

  // To location handlers
  const handleToBuildingSelect = (building: LocationData | null) => {
    setToBuilding(building)
    setToArea(null)
    setToFloor(null)
    setToDetailLocation(null)
    setToInventory([]) // Clear inventory when location changes
  }

  const handleToAreaSelect = (area: LocationData | null) => {
    setToArea(area)
    setToFloor(null)
    setToDetailLocation(null)
    setToInventory([]) // Clear inventory when location changes
  }

  const handleToFloorSelect = (floor: LocationData | null) => {
    setToFloor(floor)
    setToDetailLocation(null)
    setToInventory([]) // Clear inventory when location changes
  }

  const handleToDetailLocationSelect = (detailLocation: LocationData | null) => {
    setToDetailLocation(detailLocation)
    // Auto-load inventory when all location levels are selected
    if (detailLocation && toBuilding && toArea && toFloor) {
      // Pass current values directly to avoid state update delay
      loadToInventoryWithParams(toBuilding, toArea, toFloor, detailLocation)
    } else {
      setToInventory([])
    }
  }

  // Utility functions
  const getStatusDisplay = (status?: number) => {
    const statusMap: Record<number, { label: string, color: string }> = {
      0: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Active', color: 'bg-green-100 text-green-800' },
      2: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: 'Retired', color: 'bg-red-100 text-red-800' },
      4: { label: 'Missing', color: 'bg-purple-100 text-purple-800' }
    }
    
    const statusInfo = status !== undefined ? statusMap[status] : null
    return statusInfo ? {
      text: statusInfo.label,
      className: statusInfo.color
    } : {
      text: 'Unknown',
      className: 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category?: string) => {
    const colors = {
      'A-Category': 'bg-blue-100 text-blue-800',
      'B-Category': 'bg-purple-100 text-purple-800',
      'C-Category': 'bg-green-100 text-green-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // From inventory selection handler
  const handleFromItemSelect = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedFromItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedFromItems(newSelected)
  }

  // To inventory selection handler
  const handleToItemSelect = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedToItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedToItems(newSelected)
  }

  // Drag and drop handlers for From inventory
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, item: InventoryItem) => {
    // Only allow drag if the item is selected
    if (!selectedFromItems.has(item.id)) {
      e.preventDefault()
      return
    }
    
    // Set drag data with selected items
    const selectedItems = fromInventory.filter(invItem => selectedFromItems.has(invItem.id))
    e.dataTransfer.setData('application/json', JSON.stringify(selectedItems))
    e.dataTransfer.effectAllowed = 'move'
    
    // Get the first selected row to measure dimensions and create exact replica
    const firstSelectedRow = document.querySelector(`[data-item-id="${Array.from(selectedFromItems)[0]}"]`) as HTMLTableRowElement
    if (!firstSelectedRow) return
    
    const rowRect = firstSelectedRow.getBoundingClientRect()
    
    // Create table structure that matches the original exactly
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'absolute'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = `${rowRect.width}px`
    dragPreview.style.backgroundColor = '#ffffff'
    dragPreview.style.border = '3px solid #2563eb'
    dragPreview.style.borderRadius = '8px'
    dragPreview.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
    dragPreview.style.overflow = 'hidden'
    dragPreview.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    dragPreview.style.opacity = '1'
    dragPreview.style.filter = 'none'
    dragPreview.style.transform = 'none'
    
    // Create table element
    const table = document.createElement('table')
    table.style.width = '100%'
    table.style.borderCollapse = 'collapse'
    table.style.margin = '0'
    table.style.fontSize = '14px'
    table.style.backgroundColor = '#ffffff'
    table.style.opacity = '1'
    
    // Create tbody
    const tbody = document.createElement('tbody')
    
    // Add selected items as table rows (max 3)
    const maxItemsToShow = 3
    let itemCount = 0
    
    selectedFromItems.forEach(itemId => {
      if (itemCount >= maxItemsToShow) return
      
      const selectedItem = fromInventory.find(inv => inv.id === itemId)
      if (selectedItem) {
        const statusDisplay = getStatusDisplay(selectedItem.status)
        
        const row = document.createElement('tr')
        row.style.backgroundColor = itemCount % 2 === 0 ? '#f9fafb' : '#ffffff'
        row.style.borderBottom = itemCount < Math.min(selectedFromItems.size, maxItemsToShow) - 1 ? '1px solid #e5e7eb' : 'none'
        row.style.opacity = '1'
        
        // Category column
        const categoryCell = document.createElement('td')
        categoryCell.style.padding = '8px 12px'
        categoryCell.style.whiteSpace = 'nowrap'
        categoryCell.style.width = '120px'
        categoryCell.style.backgroundColor = 'inherit'
        categoryCell.style.opacity = '1'
        categoryCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: #3b82f6; color: white; opacity: 1;">${selectedItem.categories?.name || 'Uncategorized'}</span>`
        
        // Item Name column
        const itemNameCell = document.createElement('td')
        itemNameCell.style.padding = '8px 12px'
        itemNameCell.style.whiteSpace = 'nowrap'
        itemNameCell.style.fontWeight = '600'
        itemNameCell.style.color = '#1f2937'
        itemNameCell.style.width = '140px'
        itemNameCell.style.backgroundColor = 'inherit'
        itemNameCell.style.opacity = '1'
        itemNameCell.textContent = selectedItem.items?.name || 'Unknown Item'
        
        // Barcode column
        const barcodeCell = document.createElement('td')
        barcodeCell.style.padding = '8px 12px'
        barcodeCell.style.whiteSpace = 'nowrap'
        barcodeCell.style.color = '#6b7280'
        barcodeCell.style.width = '120px'
        barcodeCell.style.backgroundColor = 'inherit'
        barcodeCell.style.opacity = '1'
        barcodeCell.textContent = selectedItem.barcode || selectedItem.items?.barcode || '-'
        
        // Location column
        const locationCell = document.createElement('td')
        locationCell.style.padding = '8px 12px'
        locationCell.style.color = '#6b7280'
        locationCell.style.width = '180px'
        locationCell.style.backgroundColor = 'inherit'
        locationCell.style.opacity = '1'
        locationCell.innerHTML = `
          <div style="font-size: 13px; font-weight: 500; color: #374151; opacity: 1;">${selectedItem.buildings?.name || '-'}</div>
          <div style="font-size: 11px; color: #9ca3af; opacity: 1;">
            ${selectedItem.areas?.name ? selectedItem.areas.name + ' / ' : ''}${selectedItem.floors?.name ? selectedItem.floors.name + ' / ' : ''}${selectedItem.detail_locations?.name || ''}
          </div>
        `
        
        // Status column
        const statusCell = document.createElement('td')
        statusCell.style.padding = '8px 12px'
        statusCell.style.whiteSpace = 'nowrap'
        statusCell.style.width = '80px'
        statusCell.style.backgroundColor = 'inherit'
        statusCell.style.opacity = '1'
        statusCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: #10b981; color: white; opacity: 1;">${statusDisplay.text}</span>`
        
        // Is Throw column
        const throwCell = document.createElement('td')
        throwCell.style.padding = '8px 12px'
        throwCell.style.whiteSpace = 'nowrap'
        throwCell.style.width = '60px'
        throwCell.style.backgroundColor = 'inherit'
        throwCell.style.opacity = '1'
        throwCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; opacity: 1; ${selectedItem.is_throw ? 'background-color: #ef4444; color: white;' : 'background-color: #10b981; color: white;'}">${selectedItem.is_throw ? 'Yes' : 'No'}</span>`
        
        row.appendChild(categoryCell)
        row.appendChild(itemNameCell)
        row.appendChild(barcodeCell)
        row.appendChild(locationCell)
        row.appendChild(statusCell)
        row.appendChild(throwCell)
        
        tbody.appendChild(row)
        itemCount++
      }
    })
    
    // Add "more items" row if needed
    if (selectedFromItems.size > maxItemsToShow) {
      const moreRow = document.createElement('tr')
      moreRow.style.backgroundColor = '#f1f5f9'
      moreRow.style.borderTop = '1px solid #e5e7eb'
      
      const moreCell = document.createElement('td')
      moreCell.colSpan = 6
      moreCell.style.padding = '8px 12px'
      moreCell.style.textAlign = 'center'
      moreCell.style.color = '#6b7280'
      moreCell.style.fontSize = '12px'
      moreCell.style.fontStyle = 'italic'
      moreCell.textContent = `... and ${selectedFromItems.size - maxItemsToShow} more item${selectedFromItems.size - maxItemsToShow > 1 ? 's' : ''}`
      
      moreRow.appendChild(moreCell)
      tbody.appendChild(moreRow)
    }
    
    table.appendChild(tbody)
    dragPreview.appendChild(table)
    
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, Math.floor(rowRect.width / 2), 20)
    
    // Clean up after drag
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview)
      }
    }, 100)
    
    // Set dragging state
    setIsDragging(true)
    setDragDirection('from-to')
  }

  const handleDragEnd = () => {
    // Reset dragging state
    setIsDragging(false)
    setDragDirection(null)
  }

  // Drag and drop handlers for To inventory
  const handleToDragStart = (e: React.DragEvent<HTMLTableRowElement>, item: InventoryItem) => {
    // Only allow drag if the item is selected
    if (!selectedToItems.has(item.id)) {
      e.preventDefault()
      return
    }
    
    // Set drag data with selected items
    const selectedItems = toInventory.filter(invItem => selectedToItems.has(invItem.id))
    e.dataTransfer.setData('application/json', JSON.stringify(selectedItems))
    e.dataTransfer.effectAllowed = 'move'
    
    // Create drag preview using the same logic as From inventory
    const firstSelectedRow = document.querySelector(`[data-item-id="${Array.from(selectedToItems)[0]}"]`) as HTMLTableRowElement
    if (!firstSelectedRow) return
    
    const rowRect = firstSelectedRow.getBoundingClientRect()
    
    // Create table structure that matches the original exactly
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'absolute'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = `${rowRect.width}px`
    dragPreview.style.backgroundColor = '#ffffff'
    dragPreview.style.border = '3px solid #10b981'
    dragPreview.style.borderRadius = '8px'
    dragPreview.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
    dragPreview.style.overflow = 'hidden'
    dragPreview.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    dragPreview.style.opacity = '1'
    dragPreview.style.filter = 'none'
    dragPreview.style.transform = 'none'
    
    // Create table element
    const table = document.createElement('table')
    table.style.width = '100%'
    table.style.borderCollapse = 'collapse'
    table.style.margin = '0'
    table.style.fontSize = '14px'
    table.style.backgroundColor = '#ffffff'
    table.style.opacity = '1'
    
    // Create tbody
    const tbody = document.createElement('tbody')
    
    // Add selected items as table rows (max 3)
    const maxItemsToShow = 3
    let itemCount = 0
    
    selectedToItems.forEach(itemId => {
      if (itemCount >= maxItemsToShow) return
      
      const selectedItem = toInventory.find(inv => inv.id === itemId)
      if (selectedItem) {
        const statusDisplay = getStatusDisplay(selectedItem.status)
        
        const row = document.createElement('tr')
        row.style.backgroundColor = itemCount % 2 === 0 ? '#f9fafb' : '#ffffff'
        row.style.borderBottom = itemCount < Math.min(selectedToItems.size, maxItemsToShow) - 1 ? '1px solid #e5e7eb' : 'none'
        row.style.opacity = '1'
        
        // Category column
        const categoryCell = document.createElement('td')
        categoryCell.style.padding = '8px 12px'
        categoryCell.style.whiteSpace = 'nowrap'
        categoryCell.style.width = '120px'
        categoryCell.style.backgroundColor = 'inherit'
        categoryCell.style.opacity = '1'
        categoryCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: #10b981; color: white; opacity: 1;">${selectedItem.categories?.name || 'Uncategorized'}</span>`
        
        // Item Name column
        const itemNameCell = document.createElement('td')
        itemNameCell.style.padding = '8px 12px'
        itemNameCell.style.whiteSpace = 'nowrap'
        itemNameCell.style.fontWeight = '600'
        itemNameCell.style.color = '#1f2937'
        itemNameCell.style.width = '140px'
        itemNameCell.style.backgroundColor = 'inherit'
        itemNameCell.style.opacity = '1'
        itemNameCell.textContent = selectedItem.items?.name || 'Unknown Item'
        
        // Barcode column
        const barcodeCell = document.createElement('td')
        barcodeCell.style.padding = '8px 12px'
        barcodeCell.style.whiteSpace = 'nowrap'
        barcodeCell.style.color = '#6b7280'
        barcodeCell.style.width = '120px'
        barcodeCell.style.backgroundColor = 'inherit'
        barcodeCell.style.opacity = '1'
        barcodeCell.textContent = selectedItem.barcode || selectedItem.items?.barcode || '-'
        
        // Location column
        const locationCell = document.createElement('td')
        locationCell.style.padding = '8px 12px'
        locationCell.style.color = '#6b7280'
        locationCell.style.width = '180px'
        locationCell.style.backgroundColor = 'inherit'
        locationCell.style.opacity = '1'
        locationCell.innerHTML = `
          <div style="font-size: 13px; font-weight: 500; color: #374151; opacity: 1;">${selectedItem.buildings?.name || '-'}</div>
          <div style="font-size: 11px; color: #9ca3af; opacity: 1;">
            ${selectedItem.areas?.name ? selectedItem.areas.name + ' / ' : ''}${selectedItem.floors?.name ? selectedItem.floors.name + ' / ' : ''}${selectedItem.detail_locations?.name || ''}
          </div>
        `
        
        // Status column
        const statusCell = document.createElement('td')
        statusCell.style.padding = '8px 12px'
        statusCell.style.whiteSpace = 'nowrap'
        statusCell.style.width = '80px'
        statusCell.style.backgroundColor = 'inherit'
        statusCell.style.opacity = '1'
        statusCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: #10b981; color: white; opacity: 1;">${statusDisplay.text}</span>`
        
        // Is Throw column
        const throwCell = document.createElement('td')
        throwCell.style.padding = '8px 12px'
        throwCell.style.whiteSpace = 'nowrap'
        throwCell.style.width = '60px'
        throwCell.style.backgroundColor = 'inherit'
        throwCell.style.opacity = '1'
        throwCell.innerHTML = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; opacity: 1; ${selectedItem.is_throw ? 'background-color: #ef4444; color: white;' : 'background-color: #10b981; color: white;'}">${selectedItem.is_throw ? 'Yes' : 'No'}</span>`
        
        row.appendChild(categoryCell)
        row.appendChild(itemNameCell)
        row.appendChild(barcodeCell)
        row.appendChild(locationCell)
        row.appendChild(statusCell)
        row.appendChild(throwCell)
        
        tbody.appendChild(row)
        itemCount++
      }
    })
    
    // Add "more items" row if needed
    if (selectedToItems.size > maxItemsToShow) {
      const moreRow = document.createElement('tr')
      moreRow.style.backgroundColor = '#f1f5f9'
      moreRow.style.borderTop = '1px solid #e5e7eb'
      
      const moreCell = document.createElement('td')
      moreCell.colSpan = 6
      moreCell.style.padding = '8px 12px'
      moreCell.style.textAlign = 'center'
      moreCell.style.color = '#6b7280'
      moreCell.style.fontSize = '12px'
      moreCell.style.fontStyle = 'italic'
      moreCell.textContent = `... and ${selectedToItems.size - maxItemsToShow} more item${selectedToItems.size - maxItemsToShow > 1 ? 's' : ''}`
      
      moreRow.appendChild(moreCell)
      tbody.appendChild(moreRow)
    }
    
    table.appendChild(tbody)
    dragPreview.appendChild(table)
    
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, Math.floor(rowRect.width / 2), 20)
    
    // Clean up after drag
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview)
      }
    }, 100)
    
    // Set dragging state
    setIsDragging(true)
    setDragDirection('to-from')
  }

  const handleToDragEnd = () => {
    // Reset dragging state
    setIsDragging(false)
    setDragDirection(null)
  }

  // Drag over handlers for To inventory (receiving from From inventory)
  const handleToDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragDirection === 'from-to') {
      setIsDragOverTo(true)
    }
  }

  const handleToDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Only hide drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverTo(false)
    }
  }

  // Drag over handlers for From inventory (receiving from To inventory)
  const handleFromDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragDirection === 'to-from') {
      setIsDragOverFrom(true)
    }
  }

  const handleFromDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Only hide drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverFrom(false)
    }
  }

  // Common move function for both drag-and-drop and button click
  const moveItemsFromTo = async (itemsToMove: InventoryItem[]) => {
    // Check if to location is selected
    if (!toDetailLocation) {
      toastError('Please select a complete "To Location" before moving items.')
      return
    }

    if (!itemsToMove || itemsToMove.length === 0) {
      return
    }

    const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    
    if (!token) {
      toastError('Authentication required')
      return
    }

    try {
      // Call the move API
      const response = await fetch('/api/inventories/move', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventoryIds: itemsToMove.map(item => item.id),
          locationData: {
            buildingId: toBuilding?.id,
            areaId: toArea?.id,
            floorId: toFloor?.id,
            detailLocationId: toDetailLocation?.id
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear selections
        setSelectedFromItems(new Set())
        setSelectedToItems(new Set())
        // Reload both inventories
        await Promise.all([loadFromInventory(), loadToInventory()])
        toastSuccess(`Successfully moved ${result.updatedCount} items to the destination location.`)
      } else {
        toastError(result.error || 'Failed to move items')
      }

    } catch (error) {
      console.error('Error moving items:', error)
      toastError('An error occurred while moving the items')
    }
  }

  // Move function for reverse direction (To -> From)
  const moveItemsToFrom = async (itemsToMove: InventoryItem[]) => {
    // Check if from location is selected
    if (!fromDetailLocation) {
      toastError('Please select a complete "From Location" before moving items.')
      return
    }

    if (!itemsToMove || itemsToMove.length === 0) {
      return
    }

    const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    
    if (!token) {
      toastError('Authentication required')
      return
    }

    try {
      // Call the move API
      const response = await fetch('/api/inventories/move', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventoryIds: itemsToMove.map(item => item.id),
          locationData: {
            buildingId: fromBuilding?.id,
            areaId: fromArea?.id,
            floorId: fromFloor?.id,
            detailLocationId: fromDetailLocation?.id
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear selections
        setSelectedFromItems(new Set())
        setSelectedToItems(new Set())
        // Reload both inventories
        await Promise.all([loadFromInventory(), loadToInventory()])
        toastSuccess(`Successfully moved ${result.updatedCount} items to the source location.`)
      } else {
        toastError(result.error || 'Failed to move items')
      }

    } catch (error) {
      console.error('Error moving items:', error)
      toastError('An error occurred while moving the items')
    }
  }

  // Drop handlers
  const handleDropToInventory = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOverTo(false)
    
    try {
      const draggedItemsData = e.dataTransfer.getData('application/json')
      const draggedItems = JSON.parse(draggedItemsData) as InventoryItem[]
      await moveItemsFromTo(draggedItems)
    } catch (error) {
      console.error('Error parsing drag data:', error)
      toastError('An error occurred while processing the drag data')
    }
  }

  const handleDropToFromInventory = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOverFrom(false)
    
    try {
      const draggedItemsData = e.dataTransfer.getData('application/json')
      const draggedItems = JSON.parse(draggedItemsData) as InventoryItem[]
      await moveItemsToFrom(draggedItems)
    } catch (error) {
      console.error('Error parsing drag data:', error)
      toastError('An error occurred while processing the drag data')
    }
  }

  // Button click handlers for moving selected items
  const handleMoveFromToButtonClick = async () => {
    const selectedItems = fromInventory.filter(item => selectedFromItems.has(item.id))
    await moveItemsFromTo(selectedItems)
  }

  const handleMoveToFromButtonClick = async () => {
    const selectedItems = toInventory.filter(item => selectedToItems.has(item.id))
    await moveItemsToFrom(selectedItems)
  }





  const loadFromInventoryWithParams = async (
    buildingParam?: LocationData | null,
    areaParam?: LocationData | null,
    floorParam?: LocationData | null,
    detailLocationParam?: LocationData | null,
    barcodeSearchParam?: string
  ) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setFromInventory([])
        return
      }

      // Use provided parameters or fall back to state
      const building = buildingParam !== undefined ? buildingParam : fromBuilding
      const area = areaParam !== undefined ? areaParam : fromArea
      const floor = floorParam !== undefined ? floorParam : fromFloor
      const detailLocation = detailLocationParam !== undefined ? detailLocationParam : fromDetailLocation
      const barcodeSearch = barcodeSearchParam !== undefined ? barcodeSearchParam : fromBarcodeSearch

      // Build query parameters based on provided or selected locations
      const params = new URLSearchParams()
      if (building) params.append('building_id', building.id.toString())
      if (area) params.append('area_id', area.id.toString())
      if (floor) params.append('floor_id', floor.id.toString())
      if (detailLocation) params.append('detail_location_id', detailLocation.id.toString())

      // Add barcode search parameter if provided
      if (barcodeSearch?.trim()) {
        params.append('barcode_search', barcodeSearch.trim())
      }

      const url = `/api/inventories${params.toString() ? '?' + params.toString() : ''}`

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
      if (data.success && data.inventories) {
        setFromInventory(data.inventories)
      } else {
        setFromInventory([])
      }
    } catch (error) {
      console.error('Error fetching from inventory:', error)
      setFromInventory([])
    } finally {
      setSelectedFromItems(new Set()) // Clear selections when reloading
    }
  }

  const loadFromInventory = async () => {
    return loadFromInventoryWithParams()
  }

  const loadToInventoryWithParams = async (
    buildingParam?: LocationData | null,
    areaParam?: LocationData | null,
    floorParam?: LocationData | null,
    detailLocationParam?: LocationData | null,
    barcodeSearchParam?: string
  ) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setToInventory([])
        return
      }

      // Use provided parameters or fall back to state
      const building = buildingParam !== undefined ? buildingParam : toBuilding
      const area = areaParam !== undefined ? areaParam : toArea
      const floor = floorParam !== undefined ? floorParam : toFloor
      const detailLocation = detailLocationParam !== undefined ? detailLocationParam : toDetailLocation
      const barcodeSearch = barcodeSearchParam !== undefined ? barcodeSearchParam : toBarcodeSearch

      // Build query parameters based on provided or selected "To" locations
      const params = new URLSearchParams()
      if (building) params.append('building_id', building.id.toString())
      if (area) params.append('area_id', area.id.toString())
      if (floor) params.append('floor_id', floor.id.toString())
      if (detailLocation) params.append('detail_location_id', detailLocation.id.toString())

      // Add barcode search parameter if provided
      if (barcodeSearch?.trim()) {
        params.append('barcode_search', barcodeSearch.trim())
      }

      const url = `/api/inventories${params.toString() ? '?' + params.toString() : ''}`

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
      if (data.success && data.inventories) {
        setToInventory(data.inventories)
      } else {
        setToInventory([])
      }
    } catch (error) {
      console.error('Error fetching to inventory:', error)
      setToInventory([])
    }
  }

  const loadToInventory = async () => {
    return loadToInventoryWithParams()
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Move Management</h1>
      <div className="flex flex-col lg:grid lg:grid-cols-9 gap-3 sm:gap-4 lg:gap-6 min-h-0  ">
        <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-2 flex flex-col gap-6 lg:min-w-0">
          <div className="bg-white rounded-lg shadow p-6 flex-1 lg:min-h-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">From location</h2>
            <div className="space-y-2">
              <div className="flex flex-row items-center gap-3 container-type-inline-size">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 @sm:hidden">Building:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="building"
                      value={fromBuilding}
                      onChange={handleFromBuildingSelect}
                      placeholder="Select Building"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Area:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="area"
                      value={fromArea}
                      onChange={handleFromAreaSelect}
                      parentId={fromBuilding?.id}
                      placeholder="Select Area"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Floor:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="floor"
                      value={fromFloor}
                      onChange={handleFromFloorSelect}
                      parentId={fromArea?.id}
                      placeholder="Select Floor"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Detail:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="detail_location"
                      value={fromDetailLocation}
                      onChange={handleFromDetailLocationSelect}
                      parentId={fromFloor?.id}
                      placeholder="Select Detail Location"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">BARCODE:</label>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={fromBarcodeSearch}
                      onChange={(e) => setFromBarcodeSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadFromInventory()
                        }
                      }}
                      placeholder="Enter search barcode or item name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={loadFromInventory}
                  disabled={!fromBuilding || !fromArea || !fromFloor || !fromDetailLocation}
                  className="w-auto self-end px-5 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex-1 lg:min-h-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">To location</h2>
            <div className="space-y-2">
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Building:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="building"
                      value={toBuilding}
                      onChange={handleToBuildingSelect}
                      placeholder="Select Building"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Area:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="area"
                      value={toArea}
                      onChange={handleToAreaSelect}
                      parentId={toBuilding?.id}
                      placeholder="Select Area"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Floor:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="floor"
                      value={toFloor}
                      onChange={handleToFloorSelect}
                      parentId={toArea?.id}
                      placeholder="Select Floor"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">Detail:</label>
                <div className="flex-1 min-w-0">
                  <div className="[&>div>label]:hidden">
                    <LocationSelect
                      type="detail_location"
                      value={toDetailLocation}
                      onChange={handleToDetailLocationSelect}
                      parentId={toFloor?.id}
                      placeholder="Select Detail Location"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">BARCODE:</label>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={toBarcodeSearch}
                      onChange={(e) => setToBarcodeSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadToInventory()
                        }
                      }}
                      placeholder="Enter search barcode or item name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={loadToInventory}
                  disabled={!toBuilding || !toArea || !toFloor || !toDetailLocation}
                  className="w-auto self-end px-5 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-7 flex flex-col gap-3 sm:gap-4 lg:gap-6 lg:min-w-0">
          <div className="bg-white rounded-lg shadow p-4 sm:p-4 lg:p-6 flex-1 lg:min-h-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">From inventory</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                {isDragging && selectedFromItems.size > 0 && (
                  <div className="text-xs sm:text-sm text-gray-600 font-medium flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="hidden sm:inline">Dragging </span>{selectedFromItems.size} item{selectedFromItems.size > 1 ? 's' : ''}
                  </div>
                )}
                {selectedFromItems.size > 0 && (
                  <button
                    onClick={handleMoveFromToButtonClick}
                    disabled={!toDetailLocation}
                    className="w-full sm:w-auto px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 sm:gap-2"
                  >                   
                    <span className="hidden sm:inline">Move </span>{selectedFromItems.size} item{selectedFromItems.size > 1 ? 's' : ''} 
                  </button>
                )}
              </div>
            </div>
            <div 
              className={`overflow-auto h-[calc(50vh-200px)]  border rounded-lg relative transition-colors ${
                isDragOverFrom 
                  ? 'border-gray-400 border-2 border-dashed bg-gray-50' 
                  : 'border-gray-200'
              }`}
              onDragOver={handleFromDragOver}
              onDragLeave={handleFromDragLeave}
              onDrop={handleDropToFromInventory}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8 sm:w-10 lg:w-12">
                      <input
                        type="checkbox"
                        checked={fromInventory.length > 0 && selectedFromItems.size === fromInventory.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFromItems(new Set(fromInventory.map(item => item.id)))
                          } else {
                            setSelectedFromItems(new Set())
                          }
                        }}
                        className="rounded border-gray-300 text-black bg-transparent shadow-sm focus:border-gray-500 focus:ring-gray-500"
                      />
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 lg:w-32">
                      Category
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24 lg:w-28">
                      Item Name
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-28 lg:w-36">
                      Barcode
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-36 lg:w-48">
                      Location
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-20 lg:w-24">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-20 lg:w-24">
                      Is Throw
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fromInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No inventory items found. Use the search filters to load inventory.
                      </td>
                    </tr>
                  ) : (
                    fromInventory.map((item) => {
                      const statusDisplay = getStatusDisplay(item.status)
                      return (
                        <tr 
                          key={item.id}
                          data-item-id={item.id}
                          className={`hover:bg-gray-50 transition-all duration-200 ${selectedFromItems.has(item.id) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                          draggable={selectedFromItems.has(item.id)}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                        >
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedFromItems.has(item.id)}
                              onChange={(e) => handleFromItemSelect(item.id, e.target.checked)}
                              className="rounded border-gray-300 text-black bg-transparent shadow-sm focus:border-gray-500 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getCategoryColor(item.categories?.name)}`}>
                              {item.categories?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            {item.items?.name || 'Unknown Item'}
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                            {item.barcode || item.items?.barcode || '-'}
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-600">
                            <div className="max-w-32 sm:max-w-48 break-words">
                              <div>{item.buildings?.name || '-'}</div>
                              <div className="text-xs text-gray-500">
                                {item.areas?.name && `${item.areas.name} / `}
                                {item.floors?.name && `${item.floors.name} / `}
                                {item.detail_locations?.name || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                              {statusDisplay.text}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              item.is_throw ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.is_throw ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Drag overlay for From inventory */}
              {isDragOverFrom && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
                    {fromDetailLocation ? (
                      <>
                        <div className="relative flex justify-center mb-2">
                          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {selectedToItems.size > 1 && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {selectedToItems.size}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setIsDragOverFrom(false)
                            handleMoveToFromButtonClick()
                          }}
                          className="inline-flex items-center justify-center px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >                          
                          Move {selectedToItems.size} Item{selectedToItems.size > 1 ? 's' : ''} Here
                        </button>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" className="mx-auto mb-1">
                          <path fill="#ad0d0dff" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z"/>
                        </svg>
                        <p className="text-sm font-medium text-red-700 mb-1">Select complete &quot;From Location&quot;</p>
                        <p className="text-xs text-red-600">Building, Area, Floor &amp; Detail Location required</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-4 lg:p-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">To inventory</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                {isDragging && selectedToItems.size > 0 && dragDirection === 'to-from' && (
                  <div className="text-xs sm:text-sm text-gray-600 font-medium flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="hidden sm:inline">Dragging </span>{selectedToItems.size} item{selectedToItems.size > 1 ? 's' : ''}<span className="hidden sm:inline"> to source</span>
                  </div>
                )}
               
                {selectedToItems.size > 0 && (
                  <button
                    onClick={handleMoveToFromButtonClick}
                    disabled={!fromDetailLocation}
                    className="w-full sm:w-auto px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <span className="hidden sm:inline">Move </span>{selectedToItems.size} item{selectedToItems.size > 1 ? 's' : ''} 
                  </button>
                )}
              </div>
            </div>
            <div 
              className={`overflow-auto h-[calc(50vh-200px)] border rounded-lg relative transition-colors ${
                isDragOverTo 
                  ? 'border-gray-400 border-2 border-dashed bg-gray-50' 
                  : 'border-gray-200'
              }`}
              onDragOver={handleToDragOver}
              onDragLeave={handleToDragLeave}
              onDrop={handleDropToInventory}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8 sm:w-10 lg:w-12">
                      <input
                        type="checkbox"
                        checked={toInventory.length > 0 && selectedToItems.size === toInventory.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedToItems(new Set(toInventory.map(item => item.id)))
                          } else {
                            setSelectedToItems(new Set())
                          }
                        }}
                        className="rounded border-gray-300 text-black bg-transparent shadow-sm focus:border-gray-500 focus:ring-gray-500"
                      />
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 lg:w-32">
                      Category
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24 lg:w-28">
                      Item Name
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-28 lg:w-36">
                      Barcode
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-36 lg:w-48">
                      Location
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-20 lg:w-24">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-20 lg:w-24">
                      Is Throw
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {toInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No items in destination inventory. Move items from the &quot;From inventory&quot; section or search for existing items.
                      </td>
                    </tr>
                  ) : (
                    toInventory.map((item) => {
                      const statusDisplay = getStatusDisplay(item.status)
                      return (
                        <tr 
                          key={item.id}
                          data-item-id={item.id}
                          className={`hover:bg-gray-50 transition-all duration-200 ${selectedToItems.has(item.id) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                          draggable={selectedToItems.has(item.id)}
                          onDragStart={(e) => handleToDragStart(e, item)}
                          onDragEnd={handleToDragEnd}
                        >
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedToItems.has(item.id)}
                              onChange={(e) => handleToItemSelect(item.id, e.target.checked)}
                              className="rounded border-gray-300 text-black bg-transparent shadow-sm focus:border-gray-500 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getCategoryColor(item.categories?.name)}`}>
                              {item.categories?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            {item.items?.name || 'Unknown Item'}
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                            {item.barcode || item.items?.barcode || '-'}
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-600">
                            <div className="max-w-32 sm:max-w-48 break-words">
                              <div>{item.buildings?.name || '-'}</div>
                              <div className="text-xs text-gray-500">
                                {item.areas?.name && `${item.areas.name} / `}
                                {item.floors?.name && `${item.floors.name} / `}
                                {item.detail_locations?.name || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                              {statusDisplay.text}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm">
                            <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              item.is_throw ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.is_throw ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Drag overlay */}
              {isDragOverTo && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
                    {toDetailLocation ? (
                      <>
                        <div className="relative flex justify-center mb-2">
                          <svg className="mx-auto h-8 w-8 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          {selectedFromItems.size > 1 && (
                            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {selectedFromItems.size}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setIsDragOverTo(false)
                            handleMoveFromToButtonClick()
                          }}
                          className="inline-flex items-center justify-center px-4 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        >
                          Move {selectedFromItems.size} Item{selectedFromItems.size > 1 ? 's' : ''} Here
                        </button>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" className="mx-auto mb-1">
                          <path fill="#ad0d0dff" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z"/>
                        </svg>
                        <p className="text-sm font-medium text-red-700 mb-1">Select complete &quot;To Location&quot;</p>
                        <p className="text-xs text-red-600">Building, Area, Floor &amp; Detail Location required</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
