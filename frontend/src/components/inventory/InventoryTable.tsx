'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'

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

interface LocationData {
  id: number
  name: string
}

interface InventoryTableProps {
  selectedBuilding: LocationData | null
  selectedArea: LocationData | null
  selectedFloor: LocationData | null
  selectedDetailLocation: LocationData | null
  onItemsAdded?: () => void
  onInventoryChanged?: () => void
  refreshTrigger?: number
}

export default function InventoryTable({ 
  selectedBuilding, 
  selectedArea, 
  selectedFloor, 
  selectedDetailLocation,
  onItemsAdded,
  onInventoryChanged,
  refreshTrigger
}: InventoryTableProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editableItem, setEditableItem] = useState<InventoryItem | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isThrowDropdownOpen, setIsThrowDropdownOpen] = useState(false)
  
  // Refs for click outside handling
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const throwDropdownRef = useRef<HTMLDivElement>(null)

  const fetchInventoryItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        return
      }

      // Build query parameters based on selected locations
      const params = new URLSearchParams()
      if (selectedBuilding) params.append('building_id', selectedBuilding.id.toString())
      if (selectedArea) params.append('area_id', selectedArea.id.toString())
      if (selectedFloor) params.append('floor_id', selectedFloor.id.toString())
      if (selectedDetailLocation) params.append('detail_location_id', selectedDetailLocation.id.toString())

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
        setInventoryItems(data.inventories)
      }
    } catch {
      // Error fetching inventory items
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [selectedBuilding, selectedArea, selectedFloor, selectedDetailLocation])

  useEffect(() => {
    fetchInventoryItems()
  }, [fetchInventoryItems])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchInventoryItems(true) // Silent refresh
    }
  }, [refreshTrigger, fetchInventoryItems])

  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditableItem({ ...item })
  }

  // Status and throw dropdown options
  const statusOptions = useMemo(() => ({
    0: 'Inactive',
    1: 'Active', 
    2: 'Maintenance',
    3: 'Retired',
    4: 'Missing'
  }), [])

  const throwOptions = useMemo(() => ({
    'false': 'No',
    'true': 'Yes'
  }), [])

  const closeDetailView = () => {
    setSelectedItem(null)
    setEditableItem(null)
    setIsStatusDropdownOpen(false)
    setIsThrowDropdownOpen(false)
  }

  const handleInputChange = (field: keyof InventoryItem, value: string | number | boolean | null) => {
    if (editableItem) {
      setEditableItem({ ...editableItem, [field]: value })
    }
  }

  // Handle dropdown selections
  const handleStatusSelect = useCallback((status: number) => {
    if (editableItem) {
      setEditableItem({ ...editableItem, status })
    }
    setIsStatusDropdownOpen(false)
  }, [editableItem])

  const handleThrowSelect = useCallback((isThrow: boolean) => {
    if (editableItem) {
      setEditableItem({ ...editableItem, is_throw: isThrow })
    }
    setIsThrowDropdownOpen(false)
  }, [editableItem])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false)
      }
      if (throwDropdownRef.current && !throwDropdownRef.current.contains(event.target as Node)) {
        setIsThrowDropdownOpen(false)
      }
    }

    if (isStatusDropdownOpen || isThrowDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStatusDropdownOpen, isThrowDropdownOpen])

  const handleUpdate = async () => {
    if (!editableItem) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const requestBody = {
        purchase_date: editableItem.purchase_date,
        last_date: editableItem.last_date,
        ref_client: editableItem.ref_client,
        status: editableItem.status,
        reg_date: editableItem.reg_date,
        inv_date: editableItem.inv_date,
        comment: editableItem.comment,
        rfid: editableItem.rfid,
        barcode: editableItem.barcode,
        room_assignment: editableItem.room_assignment,
        purchase_amount: editableItem.purchase_amount,
        is_throw: editableItem.is_throw
      }
      
      const response = await fetch(`/api/inventories/${editableItem.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toastSuccess('Inventory item updated successfully!')
        await fetchInventoryItems(true)
        setSelectedItem(editableItem)
      } else {
        toastError('Failed to update inventory item: ' + result.error)
      }

    } catch {
      toastError('An error occurred while updating the inventory item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editableItem || !confirm('Are you sure you want to delete this inventory item?')) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch(`/api/inventories/${editableItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toastSuccess('Inventory item deleted successfully!')
        await fetchInventoryItems(true)
        closeDetailView()
        // Notify parent that inventory changed to refresh items list
        onInventoryChanged?.()
      } else {
        toastError('Failed to delete inventory item: ' + result.error)
      }

    } catch {
      toastError('An error occurred while deleting the inventory item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDirectDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.items?.name || 'this item'}"?`)) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch(`/api/inventories/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toastSuccess('Inventory item deleted successfully!')
        await fetchInventoryItems(true)
        // If the deleted item was selected, close the detail view
        if (selectedItem && selectedItem.id === item.id) {
          closeDetailView()
        }
        // Notify parent that inventory changed to refresh items list
        onInventoryChanged?.()
      } else {
        toastError('Failed to delete inventory item: ' + result.error)
      }

    } catch {
      toastError('An error occurred while deleting the inventory item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if ALL location filters are selected
    const hasAllLocationFilters = selectedBuilding && selectedArea && selectedFloor && selectedDetailLocation
    
    if (hasAllLocationFilters) {
      e.dataTransfer.dropEffect = 'copy'
      if (!isDragOver) {
        setIsDragOver(true)
      }
    } else {
      e.dataTransfer.dropEffect = 'none'
      if (!isDragOver) {
        setIsDragOver(true)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    // Validate that ALL location filters are selected
    const hasAllLocationFilters = selectedBuilding && selectedArea && selectedFloor && selectedDetailLocation
    if (!hasAllLocationFilters) {
      toastError('Please select ALL location filters (Building, Area, Floor, AND Detail Location) before adding items to inventory.')
      return
    }
    
    setIsProcessing(true)

    try {
      const droppedItemsData = e.dataTransfer.getData('application/json')
      const droppedItems = JSON.parse(droppedItemsData)

      if (!droppedItems || !Array.isArray(droppedItems) || droppedItems.length === 0) {
        return
      }

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
          items: droppedItems.map((item: { id: number; name: string; barcode?: string; category_id?: number }) => ({
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
        // Refresh the inventory table (silent refresh)
        await fetchInventoryItems(true)
        
        // Notify parent component
        onItemsAdded?.()
        
        // Show success message
        toastSuccess(`Successfully added ${result.createdCount} items to inventory!`)
      } else {
        toastError('Failed to create inventory records: ' + result.error)
      }

    } catch {
      toastError('An error occurred while processing the drop operation')
    } finally {
      setIsProcessing(false)
    }
  }



  const getStatusDisplay = (status?: number) => {
    const statusMap: Record<number, { label: string, color: string }> = {
      0: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Active', color: 'bg-green-100 text-green-800' },
      2: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: 'Retired', color: 'bg-red-100 text-red-800' },
      4: { label: 'Missing', color: 'bg-purple-100 text-purple-800' }
    }
    
    const statusInfo = status !== undefined ? statusMap[status] : null
    return statusInfo ? (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    ) : (
      <span className="text-gray-400 text-sm">-</span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow sm:h-[calc(100vh-440px)] xl:h-[calc(100vh-370px)] p-4 sm:p-4 lg:p-6  relative ${
          isDragOver 
            ? 'border-2 border-dashed border-gray-300' 
            : ''
        } ${isProcessing ? 'opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="pb-4 border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
        </div>

        {selectedItem ? (
          // Detail View
          <div className="flex flex-col h-[calc(100vh-450px)]">
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-md  text-gray-600">
                  Inventory Item Details
                </h3>
                <button
                  onClick={closeDetailView}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* First Column - Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.items?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.categories?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={editableItem?.barcode || editableItem?.items?.barcode || ''}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        className="text-xs text-gray-900 font-mono p-2 border border-gray-300 rounded w-full"
                        placeholder="Enter barcode"
                      />
                    </div>
                  </div>
                  
                  {/* Second Column - Location Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Building</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.buildings?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Area</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.areas?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Floor</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.floors?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Detail Location</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{selectedItem.detail_locations?.name || '-'}</p>
                    </div>
                  </div>
                  
                  {/* Third Column - Editable Fields 1 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">RFID</label>
                      <input
                        type="text"
                        value={editableItem?.rfid || ''}
                        onChange={(e) => handleInputChange('rfid', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full focus:border-gray-500"
                        placeholder="Enter RFID"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <div className="relative" ref={statusDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="w-full text-left text-xs text-gray-900 border border-gray-400 rounded-sm px-4 py-2 bg-white hover:border-gray-500 focus:outline-none focus:border-gray-500 flex items-center justify-between"
                        >
                          <span>{statusOptions[editableItem?.status as keyof typeof statusOptions] || 'Select Status'}</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isStatusDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-sm shadow-lg max-h-60 overflow-auto">
                            {Object.entries(statusOptions).map(([value, label]) => (
                              <div
                                key={value}
                                onClick={() => handleStatusSelect(parseInt(value))}
                                className="px-4 py-2 text-xs text-gray-900 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              >
                                <span>{label}</span>
                                {editableItem?.status === parseInt(value) && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Is Throw</label>
                      <div className="relative" ref={throwDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsThrowDropdownOpen(!isThrowDropdownOpen)}
                          className="w-full text-left text-xs text-gray-900 border border-gray-400 rounded-sm px-4 py-2 bg-white hover:border-gray-500 focus:outline-none focus:border-gray-500 flex items-center justify-between"
                        >
                          <span>{throwOptions[editableItem?.is_throw ? 'true' : 'false' as keyof typeof throwOptions] || 'Select Option'}</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${isThrowDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isThrowDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-sm shadow-lg max-h-60 overflow-auto">
                            {Object.entries(throwOptions).map(([value, label]) => (
                              <div
                                key={value}
                                onClick={() => handleThrowSelect(value === 'true')}
                                className="px-4 py-2 text-xs text-gray-900 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              >
                                <span>{label}</span>
                                {editableItem?.is_throw === (value === 'true') && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fourth Column - Dates */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Date</label>
                      <input
                        type="date"
                        value={editableItem?.purchase_date || ''}
                        onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Last Date</label>
                      <input
                        type="date"
                        value={editableItem?.last_date || ''}
                        onChange={(e) => handleInputChange('last_date', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Registration Date</label>
                      <input
                        type="date"
                        value={editableItem?.reg_date || ''}
                        onChange={(e) => handleInputChange('reg_date', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Inventory Date</label>
                      <input
                        type="date"
                        value={editableItem?.inv_date || ''}
                        onChange={(e) => handleInputChange('inv_date', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                      />
                    </div>
                  </div>
                  
                  {/* Fifth Column - Additional Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reference Client</label>
                      <input
                        type="text"
                        value={editableItem?.ref_client || ''}
                        onChange={(e) => handleInputChange('ref_client', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                        placeholder="Enter reference client"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Room Assignment</label>
                      <input
                        type="text"
                        value={editableItem?.room_assignment || ''}
                        onChange={(e) => handleInputChange('room_assignment', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                        placeholder="Enter room assignment"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableItem?.purchase_amount || ''}
                        onChange={(e) => handleInputChange('purchase_amount', parseFloat(e.target.value) || null)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                        placeholder="Enter purchase amount"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={editableItem?.comment || ''}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    rows={2}
                    className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full "
                    placeholder="Enter comment"
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 sm:px-3 sm:py-1.5 border border-transparent text-sm sm:text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-3 sm:w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Update Item</span>
                        <span className="sm:hidden">Update</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 sm:px-3 sm:py-1.5 border border-transparent text-sm sm:text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Delete Item</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                  <button
                    onClick={closeDetailView}
                    className="inline-flex items-center justify-center px-4 py-2 sm:px-3 sm:py-1.5 border border-gray-300 text-sm sm:text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : inventoryItems.length > 0 ? (
          <div className="flex flex-col h-[calc(100vh-530px)] lg:h-[calc(100vh-530px)] xl:h-[calc(100vh-450px)]  pb-3">
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full ">
              <div className="flex-1 overflow-hidden">
                <div className=" overflow-y-auto h-[calc(100vh-530px)] lg:h-[calc(100vh-530px)] xl:h-[calc(100vh-450px)]" >
                  <table className="min-w-full ">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Barcode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Is Throw
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryItems.map((item) => (
                          <tr 
                            key={item.id} 
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-3">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {item.categories?.name || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {item.items?.name || 'Unknown Item'}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm text-gray-500 font-mono">
                                {item.barcode || item.items?.barcode || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-xs text-gray-600">
                                <div>{item.buildings?.name || '-'}</div>
                                <div className="text-gray-500">
                                  {item.areas?.name && `${item.areas.name} / `}
                                  {item.floors?.name && `${item.floors.name} / `}
                                  {item.detail_locations?.name || ''}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              {getStatusDisplay(item.status)}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                item.is_throw 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.is_throw ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-3 w-24">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleRowClick(item)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Edit item"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDirectDelete(item)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete item"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-sm text-gray-500">
              No items match your current location filters.
            </p>
          </div>
        )}

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center bg-white bg-opacity-90 rounded-lg p-4 shadow-lg ">
              {selectedBuilding && selectedArea && selectedFloor && selectedDetailLocation ? (
                <>
                  <svg className="mx-auto h-6 w-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">Drop items here</p>
                </>
              ) : (
                <>                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" className="mx-auto mb-1">
                    <path fill="#ad0d0dff" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z"/>
                  </svg>
                  <p className="text-sm font-medium text-red-700 mb-1">Select ALL location filters</p>
                  <p className="text-xs text-red-600">Building, Area, Floor & Detail Location required</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>


    </>
  )
}
