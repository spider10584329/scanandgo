'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface Snapshot {
  id: number
  customer_id: number
  name: string | null
  date: string | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SnapshotPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [, setRefreshing] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
  const [editableSnapshot, setEditableSnapshot] = useState<Snapshot | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Sort options
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Dropdown states
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false)
  
  // Refs
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null)

  // Sort options
  const sortOptions = useMemo(() => ({
    'date-desc': 'Newest First',
    'date-asc': 'Oldest First',
    'name-asc': 'Name A-Z',
    'name-desc': 'Name Z-A'
  }), [])

  const pageSizeOptions = [5, 10, 20, 50]

  // Fetch snapshots with pagination and search
  const fetchSnapshots = useCallback(async (isRefresh = false, isInitialLoad = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)

      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/snapshots?${params}`, {
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
        setSnapshots(data.snapshots || [])
        setPagination(data.pagination)
      } else {
        const errorMsg = data.error || 'Failed to fetch snapshots'
        setError(errorMsg)
        if (isRefresh) {
          toastError(errorMsg)
        }
      }
    } catch (err) {
      console.error('Error fetching snapshots:', err)
      const errorMsg = 'Failed to fetch snapshots'
      setError(errorMsg)
      if (isRefresh) {
        toastError(errorMsg)
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else if (isInitialLoad) {
        setLoading(false)
      }
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm])

  useEffect(() => {
    fetchSnapshots(false, true) // Initial load
  }, [fetchSnapshots])

  // Handle changes in search, pagination, and sorting without loading screen
  useEffect(() => {
    if (!loading) { // Only fetch if not in initial loading state
      fetchSnapshots()
    }
  }, [fetchSnapshots, loading])

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-')
    setSortBy(field as 'date' | 'name')
    setSortOrder(order as 'asc' | 'desc')
    setCurrentPage(1)
    setIsSortDropdownOpen(false)
  }

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    setIsPageSizeDropdownOpen(false)
  }

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle snapshot selection - function not currently used
  // const handleSnapshotSelect = (snapshot: Snapshot) => {
  //   setSelectedSnapshot(snapshot)
  //   setEditableSnapshot({ ...snapshot })
  // }

  const closeDetailView = () => {
    setSelectedSnapshot(null)
    setEditableSnapshot(null)
  }

  // Cancel inline editing
  const handleCancelInlineEdit = () => {
    if (isCreating) {
      // Remove the temporary new record from the list
      setSnapshots(snapshots.filter(s => s.id !== 0))
    }
    setEditableSnapshot(null)
    setIsCreating(false)
  }

  // Handle input changes
  const handleInputChange = (field: keyof Snapshot, value: string) => {
    if (editableSnapshot) {
      setEditableSnapshot({ ...editableSnapshot, [field]: value })
    }
  }

  // Create new snapshot
  const handleCreateNew = () => {
    const newSnapshot: Snapshot = {
      id: 0,
      customer_id: 0,
      name: '',
      date: new Date().toISOString().split('T')[0]
    }
    // Add the new snapshot to the beginning of the list for inline editing
    setSnapshots([newSnapshot, ...snapshots])
    setEditableSnapshot(newSnapshot)
    setIsCreating(true)
  }

  // Save snapshot (create or update)
  const handleSave = async () => {
    if (!editableSnapshot) return
    
    if (!editableSnapshot.name?.trim()) {
      toastError('Content is required')
      return
    }

    if (!editableSnapshot.date?.trim()) {
      toastError('Date is required')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const requestBody = {
        name: editableSnapshot.name.trim(),
        date: editableSnapshot.date
      }

      let response
      if (isCreating) {
        response = await fetch('/api/snapshots', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
      } else {
        response = await fetch(`/api/snapshots/${editableSnapshot.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toastSuccess(isCreating ? 'Snapshot created successfully!' : 'Snapshot updated successfully!')
        if (isCreating) {
          // Replace the temporary record with the actual created record
          setSnapshots(snapshots.map(s => s.id === 0 ? result.snapshot : s))
          setIsCreating(false)
          setEditableSnapshot(null)
        } else {
          // Update the existing record in the list
          setSnapshots(snapshots.map(s => s.id === editableSnapshot.id ? result.snapshot : s))
          setEditableSnapshot(null)
        }
      } else {
        toastError(result.error || `Failed to ${isCreating ? 'create' : 'update'} snapshot`)
      }

    } catch (err) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} snapshot:`, err)
      toastError(`An error occurred while ${isCreating ? 'creating' : 'updating'} the snapshot`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete snapshot
  const handleDelete = async () => {
    if (!selectedSnapshot || isCreating) return
    
    if (!confirm('Are you sure you want to delete this snapshot? This action cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch(`/api/snapshots/${selectedSnapshot.id}`, {
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
        toastSuccess('Snapshot deleted successfully!')
        await fetchSnapshots(true)
        closeDetailView()
      } else {
        toastError(result.error || 'Failed to delete snapshot')
      }

    } catch (err) {
      console.error('Error deleting snapshot:', err)
      toastError('An error occurred while deleting the snapshot')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete snapshot from table
  const handleTableDelete = async (snapshot: Snapshot) => {
    if (!confirm(`Are you sure you want to delete Snapshot #${snapshot.id}? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch(`/api/snapshots/${snapshot.id}`, {
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
        toastSuccess('Snapshot deleted successfully!')
        await fetchSnapshots(true)
      } else {
        toastError(result.error || 'Failed to delete snapshot')
      }

    } catch (err) {
      console.error('Error deleting snapshot:', err)
      toastError('An error occurred while deleting the snapshot')
    }
  }

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setIsPageSizeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Format date for input
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return dateString || ''
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Snapshot Management</h1>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
            >
              <Image 
                src="/6-dots-spinner.svg" 
                alt="Loading" 
                width={16}
                height={16}
                className="animate-spin"
              />
              <span>Loading...</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative h-[calc(100vh-280px)] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 opacity-60"></div>
            
            <div className="relative z-10 text-center p-8">
              <div className="mb-6">
                <Image 
                  src="/6-dots-spinner.svg" 
                  alt="Loading snapshots" 
                  width={32}
                  height={32}
                  className="mx-auto animate-spin"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Loading Snapshots
                </h3>
                <p className="text-gray-600">
                  Fetching workflow records and status reviews...
                </p>               
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Snapshot Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow h-[calc(100vh-190px)]">
        {selectedSnapshot ? (
          // Detail View
          <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">
                {isCreating ? 'Create New Snapshot' : 'Edit Snapshot'}
              </h3>
              <button
                onClick={closeDetailView}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl space-y-6">
                {/* Date Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(editableSnapshot?.date || null)}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select the date for this workflow snapshot
                  </p>
                </div>

                {/* Content Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editableSnapshot?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Enter detailed workflow content, status updates, and review notes..."
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Document current workflow status, issues encountered, and action items
                    </p>
                    <span className="text-xs text-gray-400">
                      {editableSnapshot?.name?.length || 0} characters
                    </span>
                  </div>
                </div>

                {!isCreating && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Snapshot Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 font-mono">{selectedSnapshot.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Customer ID:</span>
                        <span className="ml-2 font-mono">{selectedSnapshot.customer_id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <div>
                {!isCreating && (
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeDetailView}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Image 
                        src="/6-dots-spinner.svg" 
                        alt="Saving" 
                        width={16}
                        height={16}
                        className="animate-spin"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isCreating ? 'Create Snapshot' : 'Save Changes'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // List View
          <>
            {/* Search and Controls */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 sm:w-auto w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Snapshot</span>
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search snapshots by content or date..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none "
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center space-x-2 min-w-[150px]"
                  >
                    <span className="text-sm">{sortOptions[`${sortBy}-${sortOrder}` as keyof typeof sortOptions]}</span>
                    <svg className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSortDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {Object.entries(sortOptions).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => handleSortChange(value)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm first:rounded-t-lg last:rounded-b-lg"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Page Size Dropdown */}
                <div className="relative" ref={pageSizeDropdownRef}>
                  <button
                    onClick={() => setIsPageSizeDropdownOpen(!isPageSizeDropdownOpen)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span className="text-sm">{pageSize} per page</span>
                    <svg className={`w-4 h-4 transition-transform ${isPageSizeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isPageSizeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      {pageSizeOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => handlePageSizeChange(size)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm first:rounded-t-lg last:rounded-b-lg"
                        >
                          {size} per page
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Snapshots Table */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg m-6">
              {snapshots.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Snapshots Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'No snapshots match your search criteria.' 
                      : 'Get started by creating your first workflow snapshot.'}
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create First Snapshot
                  </button>
                </div>
              ) : (
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Content Preview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {snapshots.map((snapshot) => {
                      const isEditing = editableSnapshot?.id === snapshot.id
                      
                      return (
                        <tr key={snapshot.id || 'new'} className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <div className="flex items-center gap-3">
                                <input
                                  type="date"
                                  value={formatDateForInput(editableSnapshot?.date || null)}
                                  onChange={(e) => handleInputChange('date', e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <div className="flex gap-5 items-center">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                  {formatDate(snapshot.date)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-2 text-sm text-gray-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editableSnapshot?.name || ''}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter snapshot content..."
                              />
                            ) : (
                              <div className="max-w-md">
                                <p className="line-clamp-2 text-ellipsis overflow-hidden">
                                  {snapshot.name || 'No content available'}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                                  title="Save"
                                >
                                  {isSaving ? (
                                    <Image 
                                      src="/6-dots-spinner.svg" 
                                      alt="Saving" 
                                      width={12}
                                      height={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    'Save'
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelInlineEdit}
                                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedSnapshot(snapshot)
                                    setEditableSnapshot({ ...snapshot })
                                  }}
                                  className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Edit Snapshot"
                                  type="button"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTableDelete(snapshot)
                                  }}
                                  className="text-gray-600 hover:text-red-600 transition-colors"
                                  title="Delete Snapshot"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} snapshots
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        page === currentPage
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
