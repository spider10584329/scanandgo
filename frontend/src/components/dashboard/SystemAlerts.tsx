'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  actionable: boolean
  actionUrl?: string
}

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSystemAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token') || 
                   document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) return

      const response = await fetch('/api/system/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAlerts(data.alerts)
        }
      } else {
        // Generate mock alerts for demo purposes since the API doesn't exist yet
        generateMockAlerts()
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      generateMockAlerts()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystemAlerts()
  }, [fetchSystemAlerts])

  const generateMockAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Missing Items',
        message: '12 items have been missing for over 7 days',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionable: true,
        actionUrl: '/admin/missing'
      },
      {
        id: '2',
        type: 'info',
        title: 'Duplicate Barcodes Detected',
        message: '3 duplicate barcode entries need attention',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        actionable: true,
        actionUrl: '/admin/duplicates'
      },
      {
        id: '3',
        type: 'success',
        title: 'Inventory Sync Complete',
        message: 'Latest inventory snapshot completed successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actionable: false
      },
      {
        id: '4',
        type: 'warning',
        title: 'Low Activity Location',
        message: 'Room-3 has had no inventory updates in 30 days',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        actionable: true,
        actionUrl: '/admin/location'
      }
    ]
    setAlerts(mockAlerts)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '/error.svg'
      case 'warning':
        return '/warning.svg'
      case 'info':
        return '/notification.svg'
      case 'success':
        return '/success.svg'
      default:
        return '/notification.svg'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Image src="/success.svg" alt="No alerts" width={48} height={48} className="mx-auto mb-2 opacity-50" />
          <p>All systems running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Image 
                    src={getAlertIcon(alert.type)} 
                    alt={alert.type} 
                    width={20} 
                    height={20}
                    className="mt-0.5"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {alert.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {alert.message}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                    {alert.actionable && alert.actionUrl && (
                      <button 
                        onClick={() => window.location.href = alert.actionUrl!}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all alerts →
          </button>
        </div>
      )}
    </div>
  )
}
