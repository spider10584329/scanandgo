'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface LocationData {
  id: number
  name: string
}

interface LocationSelectProps {
  type: 'building' | 'area' | 'floor' | 'detail_location'
  value: LocationData | null
  onChange: (location: LocationData | null) => void
  parentId?: number | null
  disabled?: boolean
  placeholder?: string
}

const locationConfig = {
  building: {
    label: 'Building',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-3a1 1 0 011-1h1a1 1 0 011 1v3',
    apiPath: 'buildings'
  },
  area: {
    label: 'Area',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
    apiPath: 'areas'
  },
  floor: {
    label: 'Floor',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    apiPath: 'floors'
  },
  detail_location: {
    label: 'Detail Location',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    apiPath: 'detail-locations'
  }
}

export default function LocationSelect({ 
  type, 
  value, 
  onChange, 
  parentId, 
  disabled = false,
  placeholder 
}: LocationSelectProps) {
  const [locations, setLocations] = useState<LocationData[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'down' | 'up'>('down')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const config = locationConfig[type]
  const displayPlaceholder = placeholder || `Select ${config.label}`

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        console.error('No authentication token found')
        return
      }

      let url = `/api/${config.apiPath}`
      if (parentId && type !== 'building') {
        const parentParam = type === 'area' ? 'building_id' : 
                           type === 'floor' ? 'area_id' : 
                           type === 'detail_location' ? 'floor_id' : ''
        url += `?${parentParam}=${parentId}`
      }

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
      if (data.success) {
        let locationKey = config.apiPath.replace('-', '_')
        // Special case for detail-locations API which returns 'detailLocations'  
        if (type === 'detail_location') {
          locationKey = 'detailLocations'
        }
        setLocations(data[locationKey] || [])
      }
    } catch (error) {
      console.error(`Error fetching ${config.label.toLowerCase()}s:`, error)
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [type, parentId, config])

  useEffect(() => {
    if (type === 'building' || parentId !== undefined) {
      fetchLocations()
    } else {
      setLocations([])
    }
  }, [fetchLocations, type, parentId])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocationSelect = (location: LocationData | null) => {
    onChange(location)
    setIsDropdownOpen(false)
  }

  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return 'down'
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 200 // Approximate max height of dropdown (max-h-48 ≈ 192px + padding)
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    
    // If not enough space below but enough space above, position upward
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return 'up'
    }
    
    return 'down'
  }

  const handleDropdownToggle = () => {
    if (!shouldBeDisabled) {
      if (!isDropdownOpen) {
        const position = calculateDropdownPosition()
        setDropdownPosition(position)
      }
      setIsDropdownOpen(!isDropdownOpen)
    }
  }

  const shouldBeDisabled = disabled || (type !== 'building' && !parentId)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {config.label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={handleDropdownToggle}
        disabled={shouldBeDisabled}
        className={`
          relative w-full bg-white border border-gray-400 rounded-sm  px-4 py-2 text-left cursor-pointer text-sm
          hover:border-gray-400 transition-all duration-200
          ${shouldBeDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${isDropdownOpen ? ' border-blue-500' : ''}
        `}
      >
        <div className="flex items-center">
          <span className={`block truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
            {loading ? 'Loading...' : value ? value.name : displayPlaceholder}
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

      {isDropdownOpen && !shouldBeDisabled && (
        <div className={`absolute z-40 w-full bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden ${
          dropdownPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <div className="max-h-48 overflow-y-auto  p-2">
            {/* Clear Selection Option */}
            <button
              type="button"
              onClick={() => handleLocationSelect(null)}
              className={`
                w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm
                
              `}
            >
              <div className="flex items-center justify-between  text-gray-400  hover:text-gray-600">
                <span>Clear Selection</span>
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded flex items-center justify-center                  
                `}>
                  <svg 
                    className={`w-4 h-4`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>                
              </div>
            </button>

            {/* Location Options */}
            {locations.length > 0 ? (
              locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleLocationSelect(location)}
                  className={`
                    w-full px-3 py-2 text-left  rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="truncate">{location.name}</span>
                    </div>
                    {value?.id === location.id && (
                      <div className="flex-shrink-0">✔</div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-gray-500">
                <svg className="mx-auto h-6 w-6 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                </svg>
                <p className="text-xs">No {config.label.toLowerCase()}s found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
