'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface Operator {
  id: number
  customer_id: number
  username: string
  password: string
  passwordRequest: string | null
  isPasswordRequest: number | null
  isActive: number | null
}

export default function UserPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<Operator | null>(null)
  const [editableUser, setEditableUser] = useState<Operator | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'password-request'>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAccountStatusDropdownOpen, setIsAccountStatusDropdownOpen] = useState(false)
  const [isPasswordRequestDropdownOpen, setIsPasswordRequestDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const accountStatusDropdownRef = useRef<HTMLDivElement>(null)
  const passwordRequestDropdownRef = useRef<HTMLDivElement>(null)

  // Filter options mapping
  const filterOptions = useMemo(() => ({
    'all': 'All Users',
    'active': 'Active Only', 
    'inactive': 'Inactive Only',
    'password-request': 'Password Requests'
  }), [])

  const handleFilterSelect = (filter: 'all' | 'active' | 'inactive' | 'password-request') => {
    setStatusFilter(filter)
    setIsDropdownOpen(false)
  }

  // Account status options
  const accountStatusOptions = useMemo(() => ({
    0: 'Inactive',
    1: 'Active'
  }), [])

  // Password request status options
  const passwordRequestOptions = useMemo(() => ({
    0: 'Normal',
    1: 'Password Reset Requested'
  }), [])

  const handleAccountStatusSelect = (status: number) => {
    handleInputChange('isActive', status)
    setIsAccountStatusDropdownOpen(false)
  }

  const handlePasswordRequestSelect = (status: number) => {
    handleInputChange('isPasswordRequest', status)
    setIsPasswordRequestDropdownOpen(false)
  }

  // Status mapping
  const statusMap = useMemo(() => ({
    0: { label: 'Inactive', className: 'bg-red-100 text-red-800' },
    1: { label: 'Active', className: 'bg-green-100 text-green-800' }
  }), [])

  const getStatusDisplay = useCallback((isActive: number | null) => {
    if (isActive === null || isActive === 0) return statusMap[0]
    return statusMap[1] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
  }, [statusMap])

  const getPasswordRequestStatus = useCallback((isPasswordRequest: number | null) => {
    if (isPasswordRequest === 1) {
      return { label: 'Requested', className: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'Normal', className: 'bg-gray-100 text-gray-800' }
  }, [])

  // Fetch operators
  const fetchOperators = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch('/api/users', {
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
        setOperators(data.users || [])       
      } else {
        const errorMsg = data.error || 'Failed to fetch users'
        setError(errorMsg)
        if (isRefresh) {
          toastError(errorMsg)
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      const errorMsg = 'Failed to fetch users'
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

  // Filter operators based on search and status
  const filteredOperators = useMemo(() => {
    return operators.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesStatus = true
      if (statusFilter === 'active') {
        matchesStatus = user.isActive === 1
      } else if (statusFilter === 'inactive') {
        matchesStatus = user.isActive === 0 || user.isActive === null
      } else if (statusFilter === 'password-request') {
        matchesStatus = user.isPasswordRequest === 1
      }
      
      return matchesSearch && matchesStatus
    })
  }, [operators, searchTerm, statusFilter])

  // Edit handlers
  const handleEdit = useCallback((user: Operator) => {
    setEditingUser(user)
    setEditableUser({ ...user, password: '' })
  }, [])

  const closeEditView = useCallback(() => {
    setEditingUser(null)
    setEditableUser(null)
  }, [])

  const handleInputChange = useCallback((field: keyof Operator, value: string | number | null) => {
    if (editableUser) {
      setEditableUser({ ...editableUser, [field]: value })
    }
  }, [editableUser])

  // Update user
  const handleUpdate = async () => {
    if (!editableUser) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      // Prepare request body
      const requestBody: Record<string, unknown> = {
        isActive: editableUser.isActive,
        isPasswordRequest: editableUser.isPasswordRequest
      }

      // If password is provided, include it and automatically reset password request status
      if (editableUser.password && editableUser.password.trim() !== '') {
        requestBody.password = editableUser.password.trim()
        requestBody.isPasswordRequest = 0 // Automatically reset to normal when password is set
      }
      
      const response = await fetch(`/api/users/${editableUser.id}`, {
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
        // Refresh the users list (silent refresh)
        await fetchOperators(true)
        setEditingUser(result.user)
        setEditableUser({ ...result.user, password: '' }) // Clear password field after successful update
        if (requestBody.password) {
          toastSuccess('User updated and password reset successfully')
        } else {
          toastSuccess('User updated successfully')
        }
      } else {
        setError('Failed to update user: ' + result.error)
        toastError(result.error || 'Failed to update user')
      }

    } catch (err) {
      console.error('Error updating user:', err)
      setError('An error occurred while updating the user')
      toastError('An error occurred while updating the user')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete user
  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch(`/api/users/${id}`, {
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
        // Remove the deleted user from the list
        setOperators(prev => prev.filter(user => user.id !== id))
        // If the deleted user was being edited, close the edit view
        if (editingUser && editingUser.id === id) {
          closeEditView()
        }
        toastSuccess('User deleted successfully')
      } else {
        setError(data.error || 'Failed to delete user')
        toastError(data.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Failed to delete user')
      toastError('Failed to delete user')
    }
  }

  // Reset password function removed - not currently used

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (accountStatusDropdownRef.current && !accountStatusDropdownRef.current.contains(event.target as Node)) {
        setIsAccountStatusDropdownOpen(false)
      }
      if (passwordRequestDropdownRef.current && !passwordRequestDropdownRef.current.contains(event.target as Node)) {
        setIsPasswordRequestDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  if (loading) {
    return (
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900">User Management</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <button
              disabled
              className="px-4 py-2 sm:py-1 bg-gray-400 text-white rounded-full cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Image 
                src="/6-dots-spinner.svg" 
                alt="Loading" 
                width={16}
                height={16}
                className="animate-spin"
              />
              <span className="hidden sm:inline">Loading...</span>
              <span className="sm:hidden">Loading...</span>
            </button>
            <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-center">
              Loading...
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative h-[calc(100vh-280px)] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 opacity-60"></div>
            
            <div className="relative z-10 text-center p-8">
              <div className="mb-6">
                <Image 
                  src="/6-dots-spinner.svg" 
                  alt="Loading users" 
                  width={32}
                  height={32}
                  className="mx-auto animate-spin"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Loading Users
                </h3>
                <p className="text-gray-600">
                  Fetching user accounts and analyzing data...
                </p>               
              </div>
            </div>
            
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
        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">User Management</h1>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <div className="text-red-500 text-base sm:text-lg mb-2">Error</div>
            <p className="text-gray-600 text-sm sm:text-base px-4">{error}</p>
            <button
              onClick={() => fetchOperators(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
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
      <div className="flex flex-col gap-4 mb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 pt-2">User Management</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <button
            onClick={() => fetchOperators(true)}
            disabled={refreshing}
            className="px-4 sm:px-6 py-2 sm:py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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
                <span className="hidden sm:inline">Refreshing...</span>
                <span className="sm:hidden">↻ Refresh</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻ Refresh</span>
              </>
            )}
          </button>
          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-center">
            {filteredOperators.length} user{filteredOperators.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-190px)]">
        {editingUser ? (
          // Edit View
          <div className="flex flex-col h-full">
            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white">
              <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm sm:text-md text-gray-600 truncate">
                  <span className="hidden sm:inline">Edit User - {editingUser.username}</span>
                  <span className="sm:hidden">Edit: {editingUser.username}</span>
                </h3>
                <button
                  onClick={closeEditView}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">User ID</label>
                      <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{editingUser.id}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                      <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{editingUser.username}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Customer ID</label>
                      <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{editingUser.customer_id}</p>
                    </div>
                  </div>
                  
                  {/* Status Controls */}
                  <div className="space-y-4">
                    <div className="relative" ref={accountStatusDropdownRef}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Account Status</label>
                      <button
                        type="button"
                        onClick={() => setIsAccountStatusDropdownOpen(!isAccountStatusDropdownOpen)}
                        className={`
                          relative w-full bg-white border border-gray-400 rounded-sm px-4 py-2 text-left cursor-pointer text-sm
                          hover:border-gray-400 transition-all duration-200
                          ${isAccountStatusDropdownOpen ? ' border-blue-500' : ''}
                        `}
                      >
                        <div className="flex items-center">
                          <span className="block truncate text-gray-900">
                            {accountStatusOptions[editableUser?.isActive as keyof typeof accountStatusOptions] || accountStatusOptions[0]}
                          </span>
                        </div>
                        
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAccountStatusDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isAccountStatusDropdownOpen && (
                        <div className="absolute z-40 w-full bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden top-full mt-1">
                          <div className="max-h-48 overflow-y-auto p-2">
                            {Object.entries(accountStatusOptions).map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleAccountStatusSelect(parseInt(key))}
                                className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="truncate">{label}</span>
                                  </div>
                                  {(editableUser?.isActive || 0) === parseInt(key) && (
                                    <div className="flex-shrink-0">✔</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative" ref={passwordRequestDropdownRef}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password Request Status</label>
                      <button
                        type="button"
                        onClick={() => setIsPasswordRequestDropdownOpen(!isPasswordRequestDropdownOpen)}
                        className={`
                          relative w-full bg-white border border-gray-400 rounded-sm px-4 py-2 text-left cursor-pointer text-sm
                          hover:border-gray-400 transition-all duration-200
                          ${isPasswordRequestDropdownOpen ? ' border-blue-500' : ''}
                        `}
                      >
                        <div className="flex items-center">
                          <span className="block truncate text-gray-900">
                            {passwordRequestOptions[editableUser?.isPasswordRequest as keyof typeof passwordRequestOptions] || passwordRequestOptions[0]}
                          </span>
                        </div>
                        
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPasswordRequestDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isPasswordRequestDropdownOpen && (
                        <div className="absolute z-40 w-full bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden top-full mt-1">
                          <div className="max-h-48 overflow-y-auto p-2">
                            {Object.entries(passwordRequestOptions).map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handlePasswordRequestSelect(parseInt(key))}
                                className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="truncate">{label}</span>
                                  </div>
                                  {(editableUser?.isPasswordRequest || 0) === parseInt(key) && (
                                    <div className="flex-shrink-0">✔</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reset Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password to reset..."
                        value={editableUser?.password || ''}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="text-sm text-gray-900 p-2 border border-gray-300 rounded w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a new password to reset the user&apos;s password and clear password request status.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 sm:mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 sm:py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">💾</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Update User</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => editingUser && handleDelete(editingUser.id, editingUser.username)}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 sm:py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Delete User</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                  <button
                    onClick={closeEditView}
                    className="inline-flex items-center justify-center px-4 py-2 sm:py-1 border border-gray-300 text-sm font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Table View
          <>
            {/* Search and Filter Controls */}
            <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-48 relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`
                    relative w-full bg-white border border-gray-400 rounded-sm px-4 py-2 text-left cursor-pointer text-sm
                    hover:border-gray-400 transition-all duration-200
                    ${isDropdownOpen ? ' border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-center">
                    <span className={`block truncate ${statusFilter ? 'text-gray-900' : 'text-gray-500'}`}>
                      {filterOptions[statusFilter]}
                    </span>
                  </div>
                  
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-40 w-full bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden top-full mt-1">
                    <div className="max-h-48 overflow-y-auto p-2">
                      {Object.entries(filterOptions).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleFilterSelect(key as 'all' | 'active' | 'inactive' | 'password-request')}
                          className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="truncate">{label}</span>
                            </div>
                            {statusFilter === key && (
                              <div className="flex-shrink-0">✔</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {filteredOperators.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No users match your current filters.' 
                    : 'No users are registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-auto h-[calc(100vh-280px)] sm:h-[calc(100vh-340px)] border border-gray-200 rounded-lg">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Username
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Status
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Password Request
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Customer ID
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredOperators.map((user) => {
                      const statusDisplay = getStatusDisplay(user.isActive)
                      const passwordRequestDisplay = getPasswordRequestStatus(user.isPasswordRequest)
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200">
                            <div className="flex flex-col">
                              <span>{user.username}</span>
                              <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusDisplay.className}`}>
                                  {statusDisplay.label}
                                </span>
                                {user.isPasswordRequest === 1 && (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${passwordRequestDisplay.className}`}>
                                    PWD
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-2 border-r border-gray-200">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-2 border-r border-gray-200">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${passwordRequestDisplay.className}`}>
                              {passwordRequestDisplay.label}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                            {user.customer_id}
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-sm font-medium">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEdit(user)
                                }}
                                className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer p-1 rounded hover:bg-blue-50"
                                title="Edit User"
                                type="button"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(user.id, user.username)}
                                className="text-gray-600 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                                title="Delete User"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </>
        )}
      </div>
    </div>
  )
}
