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

  // Handle inline edit for existing snapshot
  const handleInlineEdit = (snapshot: Snapshot) => {
    setEditableSnapshot({ ...snapshot })
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
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900">Snapshot Management</h1>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
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
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 p-2 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900">Snapshot Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-190px)]">
        {/* Search and Controls */}
        <div className="border-b border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* First Row: New Snapshot Button */}
            <button
              onClick={handleCreateNew}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Snapshot</span>
            </button>
                
                {/* Second Row: Search and Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search snapshots by content or date..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                    />
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortDropdownRef}>
                      <button
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between sm:justify-center gap-2 min-w-0 sm:min-w-[150px]"
                      >
                        <span className="text-xs sm:text-sm truncate">{sortOptions[`${sortBy}-${sortOrder}` as keyof typeof sortOptions]}</span>
                        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isSortDropdownOpen && (
                        <div className="absolute left-0 sm:right-0 top-full mt-1 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          {Object.entries(sortOptions).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => handleSortChange(value)}
                              className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 text-xs sm:text-sm first:rounded-t-lg last:rounded-b-lg"
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
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between sm:justify-center gap-2"
                      >
                        <span className="text-xs sm:text-sm">{pageSize} per page</span>
                        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isPageSizeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isPageSizeDropdownOpen && (
                        <div className="absolute left-0 sm:right-0 top-full mt-1 w-full sm:w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          {pageSizeOptions.map((size) => (
                            <button
                              key={size}
                              onClick={() => handlePageSizeChange(size)}
                              className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 text-xs sm:text-sm first:rounded-t-lg last:rounded-b-lg"
                            >
                              {size} per page
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Snapshots Table */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg m-3 sm:m-4 lg:m-6">
              {snapshots.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Snapshots Found</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4">
                    {searchTerm 
                      ? 'No snapshots match your search criteria.' 
                      : 'Get started by creating your first workflow snapshot.'}
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create First Snapshot
                  </button>
                </div>
              ) : (
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Content Preview
                      </th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {snapshots.map((snapshot) => {
                      const isEditing = editableSnapshot?.id === snapshot.id
                      
                      return (
                        <tr key={snapshot.id || 'new'} className={`transition-colors ${isEditing ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span className="text-xs text-blue-600 font-medium">Editing</span>
                                </div>
                                <input
                                  type="date"
                                  value={formatDateForInput(editableSnapshot?.date || null)}
                                  onChange={(e) => handleInputChange('date', e.target.value)}
                                  className="w-full px-2 sm:px-3 py-1 border border-blue-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                            ) : (
                              <div className="flex gap-2 sm:gap-3 lg:gap-5 items-center">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                  {formatDate(snapshot.date)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 text-xs sm:text-sm text-gray-600">
                            {isEditing ? (
                              <div className="w-full">
                                <textarea
                                  value={editableSnapshot?.name || ''}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  placeholder="Enter detailed workflow content..."
                                  rows={2}
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-gray-400">
                                    Document workflow status and notes
                                  </p>
                                  <span className="text-xs text-gray-400">
                                    {(editableSnapshot?.name?.length || 0)} chars
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="max-w-32 sm:max-w-md">
                                <p className="line-clamp-2 text-ellipsis overflow-hidden">
                                  {snapshot.name || 'No content available'}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
                            {isEditing ? (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded text-xs sm:text-sm hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                                  title="Save Snapshot"
                                >
                                  {isSaving ? (
                                    <>
                                      <Image 
                                        src="/6-dots-spinner.svg" 
                                        alt="Saving" 
                                        width={12}
                                        height={12}
                                        className="animate-spin"
                                      />
                                      <span className="hidden sm:inline">Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="hidden sm:inline">{isCreating ? 'Create' : 'Save'}</span>
                                      <span className="sm:hidden">✓</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelInlineEdit}
                                  className="px-2 sm:px-3 py-1 bg-gray-500 text-white rounded text-xs sm:text-sm hover:bg-gray-600 transition-colors"
                                  title="Cancel"
                                >
                                  <span className="hidden sm:inline">Cancel</span>
                                  <span className="sm:hidden">✕</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleInlineEdit(snapshot)
                                  }}
                                  className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer p-1"
                                  title="Edit Snapshot"
                                  type="button"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTableDelete(snapshot)
                                  }}
                                  className="text-gray-600 hover:text-red-600 transition-colors p-1"
                                  title="Delete Snapshot"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="border-t border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} snapshots
                </div>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm ${
                          page === currentPage
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
              </div>
            )}
      </div>
    </div>
  )
}
