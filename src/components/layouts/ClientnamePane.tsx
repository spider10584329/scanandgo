'use client'

import { useState, useEffect } from 'react'
import { toastError, toastSuccess } from '../ui/toast'
import { useClientNameContext } from '@/contexts/ClientNameContext'

export default function ClientnamePane() {
  const [clientName, setClientName] = useState<string>('scanandgo')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const { refreshClientName } = useClientNameContext()

  useEffect(() => {
    const fetchClientName = async () => {
        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          toastError('No authentication token found')
          return
        }
        
        try {
          const response = await fetch('/api/client', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })       
          
          const data = await response.json()
          if (data.success) {
            setClientName(data.clientname || 'scanandgo')
          }
        } catch (error) {
          console.error('Error fetching client name:', error)
          setClientName('scanandgo')
        }
    }
    fetchClientName()
  }, [])

  const handleEdit = () => {
    setEditName(clientName)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditName('')
    setIsEditing(false)
  }

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toastError('Please enter a client name')
      return
    }

    if (editName.trim().length > 12) {
      toastError('Client name must be 12 characters or less')
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch('/api/client', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientname: editName.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setClientName(data.clientname)
        setIsEditing(false)
        setEditName('')
        refreshClientName() // Refresh all client name displays globally
        toastSuccess('Client name updated successfully!')
      } else {
        toastError(data.error || 'Failed to update client name')
      }
    } catch (error) {
      console.error('Error updating client name:', error)
      toastError('Failed to update client name')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow py-5 px-5 hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">CLIENT NAME</h2>
      
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={12}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none "
            placeholder="Enter client name (max 12 chars)"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdate()
              } else if (e.key === 'Escape') {
                handleCancel()
              }
            }}
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Press Enter to save, Escape to cancel</span>
            <span className={`${editName.length > 12 ? 'text-red-500' : editName.length > 10 ? 'text-yellow-500' : 'text-gray-500'}`}>
              {editName.length}/12
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">            
            <span className="inline-flex items-center px-4 py-2  text-lg font-medium rounded-full text-green-800 rounded-full">
              {clientName}
            </span>
          </div>
          <button
            onClick={handleEdit}
            className="ml-3 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none "
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}
