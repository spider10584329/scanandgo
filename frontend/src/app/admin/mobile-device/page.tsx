'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-config'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface MobileDevice {
  agents_id: number
  device_id: string
  customer_id: number
}

export default function MobileDevicePage() {
  const [devices, setDevices] = useState<MobileDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.agents.list) as { success: boolean; data: MobileDevice[]; message?: string }
      console.log('API Response:', response) // Debug log
      console.log('Devices:', response.data)
      if (response.success && response.data) {
        setDevices(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      toastError('Failed to load mobile devices')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async () => {
    if (!deviceId.trim()) {
      toastError('Please enter a device ID')
      return
    }

    try {
      setSubmitting(true)
      const response = await apiClient.post(API_ENDPOINTS.agents.register, null, {
        params: { device_id: deviceId.trim() }
      }) as { success: boolean }

      if (response.success) {
        toastSuccess('Mobile device registered successfully')
        setShowModal(false)
        setDeviceId('')
        fetchDevices() // Refresh list
      }
    } catch (error: unknown) {
      console.error('Failed to register device:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } }
        const detail = axiosError.response?.data?.detail
        if (detail && detail.includes('already registered')) {
          toastError('This device ID is already registered')
        } else {
          toastError(detail || 'Failed to register device')
        }
      } else {
        toastError('Failed to register device')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (agentsId: number, deviceIdStr: string) => {
    if (!confirm(`Are you sure you want to delete device "${deviceIdStr}"?`)) {
      return
    }

    try {
      const response = await apiClient.delete(API_ENDPOINTS.agents.delete(agentsId)) as { success: boolean }
      if (response.success) {
        toastSuccess('Device deleted successfully')
        fetchDevices() // Refresh list
      }
    } catch (error) {
      console.error('Failed to delete device:', error)
      toastError('Failed to delete device')
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image 
              src="/mobile.svg" 
              alt="Mobile device" 
              width={24} 
              height={24}
              className="text-gray-700 sm:w-8 sm:h-8"
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Mobile Device Management</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="text-xl">+</span>
            <span>Add Device</span>
          </button>
        </div>
        <p className="text-sm sm:text-base text-gray-600">Manage and register mobile devices for inventory scanning</p>
      </div>

      {/* Devices List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Image 
              src="/mobile.svg" 
              alt="Mobile device" 
              width={48} 
              height={48}
              className="mx-auto mb-4 opacity-30 sm:w-16 sm:h-16"
            />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No devices registered
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Click the ADD button to register your first mobile device
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-gray-200">
              {devices.map((device, index) => (
                <div key={device.agents_id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Device ID</div>
                      <div className="font-medium text-gray-900 break-all">{device.device_id}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(device.agents_id, device.device_id)}
                      className="ml-3 text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">No.</div>
                      <div className="text-gray-900">{index + 1}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Customer ID</div>
                      <div className="text-gray-900">{device.customer_id}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device, index) => (
                  <tr key={device.agents_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {device.device_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(device.agents_id, device.device_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Add Device Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 animate-fadeIn">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Image 
                src="/mobile.svg" 
                alt="Mobile device" 
                width={20} 
                height={20}
                className="sm:w-6 sm:h-6"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Register Mobile Device</h2>
            </div>

            <div className="mb-4 sm:mb-6">
              <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Device ID
              </label>
              <input
                id="deviceId"
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter unique device identifier"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !submitting) {
                    handleAddDevice()
                  }
                }}
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter a unique identifier for this mobile device
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={() => {
                  setShowModal(false)
                  setDeviceId('')
                }}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDevice}
                disabled={submitting || !deviceId.trim()}
                className="w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

