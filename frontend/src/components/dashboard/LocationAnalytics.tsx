'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface LocationData {
  locationName: string
  buildingName: string
  areaName: string
  floorName: string
  detailLocationName: string
  totalItems: number
  missingItems: number
  percentage: number
}

export default function LocationAnalytics() {
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocationData()
  }, [])

  const fetchLocationData = async () => {
    try {
      const token = localStorage.getItem('auth-token') || 
                   document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/inventories/location-analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.locations)) {
          setLocationData(data.locations)
        } else {
          setLocationData([])
        }
      } else {
        setLocationData([])
      }
    } catch (error) {
      console.error('Error fetching location data:', error)
      setLocationData([])
    } finally {
      setLoading(false)
    }
  }

  const getMissingPercentage = (missing: number, total: number) => {
    return total > 0 ? ((missing / total) * 100).toFixed(1) : '0'
  }

  const getRiskLevel = (percentage: number) => {
    if (percentage >= 20) return { label: 'High Risk', color: 'text-red-600 bg-red-50' }
    if (percentage >= 10) return { label: 'Medium Risk', color: 'text-yellow-600 bg-yellow-50' }
    if (percentage > 0) return { label: 'Low Risk', color: 'text-blue-600 bg-blue-50' }
    return { label: 'Good', color: 'text-green-600 bg-green-50' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!locationData || locationData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Image src="/location.svg" alt="No locations" width={48} height={48} className="mx-auto mb-2 opacity-50" />
          <p>No location data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locationData.slice(0, 6).map((location, index) => {
            const missingPercentage = parseFloat(getMissingPercentage(location.missingItems, location.totalItems))
            const riskLevel = getRiskLevel(missingPercentage)
            
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Image src="/location.svg" alt="Location" width={16} height={16} />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {location.locationName}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${riskLevel.color}`}>
                    {riskLevel.label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>{location.totalItems} total items</span>
                  <span>{location.missingItems} missing ({missingPercentage}%)</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full relative"
                    style={{ width: `${location.percentage}%` }}
                  >
                    {location.missingItems > 0 && (
                      <div 
                        className="bg-red-500 h-2 rounded-r-full absolute top-0 right-0"
                        style={{ width: `${(location.missingItems / location.totalItems) * 100}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {locationData && locationData.length > 6 && (
        <div className="pt-2 border-t border-gray-100">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all locations →
          </button>
        </div>
      )}
      
     
    </div>
  )
}
