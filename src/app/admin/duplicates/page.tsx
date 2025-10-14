'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface DuplicateInventory {
  id: number
  barcode: string | null
  room_assignment: string | null
  inv_date: string | null
  status: number | null
  is_throw: boolean
  operator_id: number | null
  items: {
    id: number
    name: string
    barcode: string | null
  } | null
  categories: {
    id: number
    name: string
  } | null
  buildings: {
    id: number
    name: string
  } | null
  areas: {
    id: number
    name: string
  } | null
  floors: {
    id: number
    name: string
  } | null
  detail_locations: {
    id: number
    name: string
  } | null
  operators: {
    id: number
    username: string
  } | null
}

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicateInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<DuplicateInventory | null>(null)
  const [editableItem, setEditableItem] = useState<DuplicateInventory | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isThrowDropdownOpen, setIsThrowDropdownOpen] = useState(false)
  
  // Refs for click outside handling
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const throwDropdownRef = useRef<HTMLDivElement>(null)

  // Remove debug logs for production performance

  const statusMap = useMemo(() => ({
    0: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
    1: { label: 'Active', className: 'bg-green-100 text-green-800' },
    2: { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800' },
    3: { label: 'Retired', className: 'bg-red-100 text-red-800' },
    4: { label: 'Missing', className: 'bg-purple-100 text-purple-800' }
  } as { [key: number]: { label: string; className: string } }), [])

  // Status dropdown options
  const statusOptions = useMemo(() => ({
    0: 'Inactive',
    1: 'Active', 
    2: 'Maintenance',
    3: 'Retired',
    4: 'Missing'
  }), [])

  // Throw dropdown options
  const throwOptions = useMemo(() => ({
    'false': 'No',
    'true': 'Yes'
  }), [])

  const getStatusDisplay = useCallback((status: number | null) => {
    if (status === null) return { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
    return statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }, [statusMap])

  const fetchDuplicates = useCallback(async (forceClear = false, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null) // Clear any previous errors
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      // Clear cache first if requested
      if (forceClear) {
        try {
          await fetch('/api/duplicates', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        } catch {
          // Ignore cache clear errors
        }
      }

      const response = await fetch('/api/duplicates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setDuplicates(data.duplicates)       
      } else {
        const errorMsg = data.error || 'Failed to fetch duplicates'
        setError(errorMsg)
        if (isRefresh) {
          toastError(errorMsg)
        }
      }
    } catch {
      const errorMsg = 'Failed to fetch duplicates'
      setError(errorMsg)
      if (isRefresh) {
        toastError(errorMsg)
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [])

  const handleEdit = useCallback((item: DuplicateInventory) => {
    setEditingItem(item)
    setEditableItem({ ...item })
  }, [])

  const closeEditView = useCallback(() => {
    setEditingItem(null)
    setEditableItem(null)
    setIsStatusDropdownOpen(false)
    setIsThrowDropdownOpen(false)
  }, [])

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

  const handleInputChange = useCallback((field: keyof DuplicateInventory, value: string | number | boolean | null) => {
    if (editableItem) {
      setEditableItem({ ...editableItem, [field]: value })
    }
  }, [editableItem])

  const handleUpdate = async () => {
    if (!editableItem) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const requestBody = {
        barcode: editableItem.barcode,
        room_assignment: editableItem.room_assignment,
        inv_date: editableItem.inv_date,
        status: editableItem.status,
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
        // Refresh the duplicates list with cache clearing (silent refresh)
        await fetchDuplicates(true, true)
        setEditingItem(result.inventory)
        setEditableItem({ ...result.inventory })
        toastSuccess('Inventory item updated successfully!')
      } else {
        const errorMsg = 'Failed to update inventory item: ' + result.error
        setError(errorMsg)
        toastError(errorMsg)
      }

    } catch (err) {
      console.error('Error updating item:', err)
      const errorMsg = 'An error occurred while updating the inventory item'
      setError(errorMsg)
      toastError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(`/api/inventories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove the deleted item from the list
        setDuplicates(prev => prev.filter(item => item.id !== id))
        // If the deleted item was being edited, close the edit view
        if (editingItem && editingItem.id === id) {
          closeEditView()
        }
        toastSuccess('Inventory item deleted successfully!')
      } else {
        const errorMsg = data.error || 'Failed to delete item'
        setError(errorMsg)
        toastError(errorMsg)
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      const errorMsg = 'Failed to delete item'
      setError(errorMsg)
      toastError(errorMsg)
    }
  }

  const formatLocation = useCallback((item: DuplicateInventory) => {
    const parts = []
    if (item.buildings?.name) parts.push(item.buildings.name)
    if (item.areas?.name) parts.push(item.areas.name)
    if (item.floors?.name) parts.push(item.floors.name)
    if (item.detail_locations?.name) parts.push(item.detail_locations.name)
    return parts.length > 0 ? parts.join(' / ') : 'Not specified'
  }, [])

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Not set'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }, [])

  useEffect(() => {
    fetchDuplicates()
  }, [fetchDuplicates])

  if (loading) {
    return (
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900">Duplicates Management</h1>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-1 bg-gray-400 text-white rounded-full cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <Image 
                src="/6-dots-spinner.svg" 
                alt="Loading" 
                width={16}
                height={16}
                className="animate-spin"
              />
              <span>Refreshing...</span>
            </button>
            <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-center">
              Loading...
            </span>
          </div>
        </div>
        
        {/* Enhanced Loading Screen with Center Focus */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative h-[calc(100vh-280px)] flex items-center justify-center">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 opacity-60"></div>
            
            {/* Central loading content */}
            <div className="relative z-10 text-center p-8">
              <div className="mb-6">
                <Image 
                  src="/6-dots-spinner.svg" 
                  alt="Loading duplicates" 
                  width={32}
                  height={32}
                  className="mx-auto animate-spin"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Loading Duplicate Records
                </h3>
                <p className="text-gray-600">
                  Scanning inventory for duplicate barcodes and analyzing data relationships...
                </p>               
              </div>
            </div>
            
            {/* Subtle table outline in background */}
            <div className="absolute inset-6 border border-gray-200 rounded-lg opacity-30">
              <div className="h-12 bg-gray-50 border-b border-gray-200 rounded-t-lg"></div>
              <div className="space-y-1 p-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded opacity-50" style={{animationDelay: `${i * 0.1}s`}}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-4">Duplicates Management</h1>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => fetchDuplicates(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 sm:gap-4 mb-4 ">
        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900">Duplicates Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchDuplicates(true, true)}
            disabled={refreshing}
            className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-1.5 sm:py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
          >
            {refreshing ? (
              <>
                <Image 
                  src="/6-dots-spinner.svg" 
                  alt="Refreshing" 
                  width={16}
                  height={16}
                  className="animate-spin"
                />
                <span>Refreshing...</span>
              </>
            ) : (
              <span>Refresh</span>
            )}
          </button>
         
          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-center">
            {duplicates.length} duplicate item{duplicates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-2 sm:p-4 lg:p-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-190px)]">
        {editingItem ? (
          // Edit View - Similar to InventoryTable
          <div className="flex flex-col h-full">
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white">
              <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm sm:text-base text-gray-600">
                  Edit Duplicate Inventory Item
                </h3>
                <button
                  onClick={closeEditView}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* First Column - Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.items?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.categories?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={editableItem?.barcode || ''}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        className="text-xs text-gray-900 font-mono p-2 border border-gray-300 rounded w-full"
                        placeholder="Enter barcode"
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
                  </div>
                  
                  {/* Second Column - Location Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Building</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.buildings?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Area</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.areas?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Floor</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.floors?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Detail Location</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.detail_locations?.name || '-'}</p>
                    </div>
                  </div>
                  
                  {/* Third Column - Editable Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Room Assignment</label>
                      <input
                        type="text"
                        value={editableItem?.room_assignment || ''}
                        onChange={(e) => handleInputChange('room_assignment', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full"
                        placeholder="Enter room assignment"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Inventory Date</label>
                      <input
                        type="date"
                        value={editableItem?.inv_date || ''}
                        onChange={(e) => handleInputChange('inv_date', e.target.value)}
                        className="text-xs text-gray-900 p-2 border border-gray-300 rounded w-full"
                      />
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
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                      <p className="text-xs text-gray-900 p-2 bg-gray-50 rounded">{editingItem.operators?.username || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-1 border border-transparent text-xs sm:text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Image 
                          src="/6-dots-spinner.svg" 
                          alt="Loading" 
                          width={16}
                          height={16}
                          className="animate-spin mr-2"
                        />
                        Saving...
                      </>
                    ) : (
                      'Update Item'
                    )}
                  </button>
                  <button
                    onClick={() => editingItem && handleDelete(editingItem.id)}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-1 border border-transparent text-xs sm:text-sm font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Item
                  </button>
                  <button
                    onClick={closeEditView}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-1 border border-gray-300 text-xs sm:text-sm font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
            <p className="text-gray-500">All inventory items have unique barcodes.</p>
          </div>
        ) : (
          <div className="overflow-auto h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)] lg:h-[calc(100vh-240px)] border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Barcode
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Category
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Item Name
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Location
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 hidden sm:table-cell">
                    Room Assignment
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 hidden md:table-cell">
                    Inv Date
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 hidden lg:table-cell">
                    Is Throw
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 hidden xl:table-cell">
                    Operator
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {duplicates.map((item) => {
                  const statusDisplay = getStatusDisplay(item.status)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                        {item.barcode || 'N/A'}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 border-r border-gray-200">
                        <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.categories?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs text-gray-900 border-r border-gray-200">
                        {item.items?.name || 'Unknown Item'}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 border-r border-gray-200">
                        <div className="text-xs text-gray-900 max-w-24 sm:max-w-xs truncate" title={formatLocation(item)}>
                          {formatLocation(item)}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs text-gray-900 border-r border-gray-200 hidden sm:table-cell">
                        {item.room_assignment || 'Not assigned'}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs text-gray-900 border-r border-gray-200 hidden md:table-cell">
                        {formatDate(item.inv_date)}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 border-r border-gray-200">
                        <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 border-r border-gray-200 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.is_throw 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.is_throw ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs text-gray-800 border-r border-gray-200 hidden xl:table-cell">
                        {item.operators?.username || 'Unknown'}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEdit(item)
                            }}
                            className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer p-1"
                            title="Edit"
                            type="button"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-600 hover:text-red-600 transition-colors p-1"
                            title="Delete"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
