'use client'

import { useState, useEffect, useCallback } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'

// Type definitions
interface Building {
  id: number
  customer_id: number
  name: string
}

interface Area {
  id: number
  customer_id: number
  building_id: number | null
  name: string
  buildings?: {
    id: number
    name: string
  } | null
}

interface Floor {
  id: number
  customer_id: number
  area_id: number | null
  name: string
  areas?: {
    id: number
    name: string
    buildings?: {
      id: number
      name: string
    } | null
  } | null
}

interface DetailLocation {
  id: number
  customer_id: number
  floor_id: number | null
  name: string
  img_data: string | null
  floors?: {
    id: number
    name: string
    areas?: {
      id: number
      name: string
      buildings?: {
        id: number
        name: string
      } | null
    } | null
  } | null
}

export default function LocationPage() {
  // State for all entities
  const [buildings, setBuildings] = useState<Building[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [detailLocations, setDetailLocations] = useState<DetailLocation[]>([])

  // Selection states
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)

  // Form states for new entries
  const [newBuildingName, setNewBuildingName] = useState('')
  const [newAreaName, setNewAreaName] = useState('')
  const [newFloorName, setNewFloorName] = useState('')
  const [newDetailLocationName, setNewDetailLocationName] = useState('')

  // Loading states
  const [isAddingBuilding, setIsAddingBuilding] = useState(false)
  const [isAddingArea, setIsAddingArea] = useState(false)
  const [isAddingFloor, setIsAddingFloor] = useState(false)
  const [isAddingDetailLocation, setIsAddingDetailLocation] = useState(false)

  // Editing states
  const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null)
  const [editingBuildingName, setEditingBuildingName] = useState('')
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null)
  const [editingFloorName, setEditingFloorName] = useState('')
  const [editingDetailLocationId, setEditingDetailLocationId] = useState<number | null>(null)
  const [editingDetailLocationName, setEditingDetailLocationName] = useState('')

  // Deleting states
  const [deletingBuildingId, setDeletingBuildingId] = useState<number | null>(null)
  const [deletingAreaId, setDeletingAreaId] = useState<number | null>(null)
  const [deletingFloorId, setDeletingFloorId] = useState<number | null>(null)
  const [deletingDetailLocationId, setDeletingDetailLocationId] = useState<number | null>(null)

  // Generic fetch function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchData = async (endpoint: string, setter: (data: any[]) => void, errorMessage: string) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch(`/api/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        // Handle the special case for detail-locations which returns 'detailLocations' in response
        const dataKey = endpoint === 'detail-locations' ? 'detailLocations' : endpoint
        setter(data[dataKey] || [])
      } else {
        toastError(data.error || errorMessage)
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      toastError(errorMessage)
    }
  }

  const fetchBuildings = useCallback(() => fetchData('buildings', setBuildings, 'Failed to load buildings'), [])
  const fetchAreas = useCallback(() => fetchData('areas', setAreas, 'Failed to load areas'), [])
  const fetchFloors = useCallback(() => fetchData('floors', setFloors, 'Failed to load floors'), [])
  const fetchDetailLocations = useCallback(() => fetchData('detail-locations', setDetailLocations, 'Failed to load detail locations'), [])

  // Fetch all data on component mount
  useEffect(() => {
    fetchBuildings()
    fetchAreas()
    fetchFloors()
    fetchDetailLocations()
  }, [fetchBuildings, fetchAreas, fetchFloors, fetchDetailLocations])

  // Building operations
  const addBuilding = async () => {
    if (!newBuildingName.trim()) {
      toastError('Building name is required')
      return
    }

    setIsAddingBuilding(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newBuildingName.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Building added successfully')
        setNewBuildingName('')
        fetchBuildings()
      } else {
        toastError(data.error || 'Failed to add building')
      }
    } catch (error) {
      console.error('Error adding building:', error)
      toastError('Failed to add building')
    } finally {
      setIsAddingBuilding(false)
    }
  }

  const updateBuilding = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/buildings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name: name.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Building updated successfully')
        setEditingBuildingId(null)
        setEditingBuildingName('')
        fetchBuildings()
      } else {
        toastError(data.error || 'Failed to update building')
      }
    } catch (error) {
      console.error('Error updating building:', error)
      toastError('Failed to update building')
    }
  }

  const deleteBuilding = async (id: number) => {
    if (!confirm('Are you sure you want to delete this building? All associated areas, floors, and detail locations will also be deleted.')) {
      return
    }

    setDeletingBuildingId(id)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/buildings', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Building deleted successfully')
        fetchBuildings()
        fetchAreas()
        fetchFloors()
        fetchDetailLocations()
        if (selectedBuilding?.id === id) {
          setSelectedBuilding(null)
          setSelectedArea(null)
          setSelectedFloor(null)
        }
      } else {
        // Check if it's a foreign key constraint error
        if (data.error && (data.error.includes('foreign key') || data.error.includes('constraint') || response.status === 500)) {
          toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
        } else {
          toastError(data.error || 'Failed to delete building')
        }
      }
    } catch (error) {
      console.error('Error deleting building:', error)
      // Check if it's likely a constraint error based on the error
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
        toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
      } else {
        toastError('Failed to delete building')
      }
    } finally {
      setDeletingBuildingId(null)
    }
  }

  // Area operations
  const addArea = async () => {
    if (!newAreaName.trim() || !selectedBuilding) {
      toastError('Area name and building selection are required')
      return
    }

    setIsAddingArea(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newAreaName.trim(),
          building_id: selectedBuilding.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Area added successfully')
        setNewAreaName('')
        fetchAreas()
      } else {
        toastError(data.error || 'Failed to add area')
      }
    } catch (error) {
      console.error('Error adding area:', error)
      toastError('Failed to add area')
    } finally {
      setIsAddingArea(false)
    }
  }

  const updateArea = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/areas', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name: name.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Area updated successfully')
        setEditingAreaId(null)
        setEditingAreaName('')
        fetchAreas()
      } else {
        toastError(data.error || 'Failed to update area')
      }
    } catch (error) {
      console.error('Error updating area:', error)
      toastError('Failed to update area')
    }
  }

  const deleteArea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this area? All associated floors and detail locations will also be deleted.')) {
      return
    }

    setDeletingAreaId(id)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/areas', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Area deleted successfully')
        fetchAreas()
        fetchFloors()
        fetchDetailLocations()
        if (selectedArea?.id === id) {
          setSelectedArea(null)
          setSelectedFloor(null)
        }
      } else {
        // Check if it's a foreign key constraint error
        if (data.error && (data.error.includes('foreign key') || data.error.includes('constraint') || response.status === 500)) {
          toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
        } else {
          toastError(data.error || 'Failed to delete area')
        }
      }
    } catch (error) {
      console.error('Error deleting area:', error)
      // Check if it's likely a constraint error based on the error
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
        toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
      } else {
        toastError('Failed to delete area')
      }
    } finally {
      setDeletingAreaId(null)
    }
  }

  // Floor operations
  const addFloor = async () => {
    if (!newFloorName.trim() || !selectedArea) {
      toastError('Floor name and area selection are required')
      return
    }

    setIsAddingFloor(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/floors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newFloorName.trim(),
          area_id: selectedArea.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Floor added successfully')
        setNewFloorName('')
        fetchFloors()
      } else {
        toastError(data.error || 'Failed to add floor')
      }
    } catch (error) {
      console.error('Error adding floor:', error)
      toastError('Failed to add floor')
    } finally {
      setIsAddingFloor(false)
    }
  }

  const updateFloor = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/floors', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name: name.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Floor updated successfully')
        setEditingFloorId(null)
        setEditingFloorName('')
        fetchFloors()
      } else {
        toastError(data.error || 'Failed to update floor')
      }
    } catch (error) {
      console.error('Error updating floor:', error)
      toastError('Failed to update floor')
    }
  }

  const deleteFloor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this floor? All associated detail locations will also be deleted.')) {
      return
    }

    setDeletingFloorId(id)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/floors', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Floor deleted successfully')
        fetchFloors()
        fetchDetailLocations()
        if (selectedFloor?.id === id) {
          setSelectedFloor(null)
        }
      } else {
        // Check if it's a foreign key constraint error
        if (data.error && (data.error.includes('foreign key') || data.error.includes('constraint') || response.status === 500)) {
          toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
        } else {
          toastError(data.error || 'Failed to delete floor')
        }
      }
    } catch (error) {
      console.error('Error deleting floor:', error)
      // Check if it's likely a constraint error based on the error
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
        toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
      } else {
        toastError('Failed to delete floor')
      }
    } finally {
      setDeletingFloorId(null)
    }
  }

  // Detail Location operations
  const addDetailLocation = async () => {
    if (!newDetailLocationName.trim() || !selectedFloor) {
      toastError('Detail location name and floor selection are required')
      return
    }

    setIsAddingDetailLocation(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/detail-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newDetailLocationName.trim(),
          floor_id: selectedFloor.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Detail location added successfully')
        setNewDetailLocationName('')
        fetchDetailLocations()
      } else {
        toastError(data.error || 'Failed to add detail location')
      }
    } catch (error) {
      console.error('Error adding detail location:', error)
      toastError('Failed to add detail location')
    } finally {
      setIsAddingDetailLocation(false)
    }
  }

  const updateDetailLocation = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/detail-locations', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name: name.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Detail location updated successfully')
        setEditingDetailLocationId(null)
        setEditingDetailLocationName('')
        fetchDetailLocations()
      } else {
        toastError(data.error || 'Failed to update detail location')
      }
    } catch (error) {
      console.error('Error updating detail location:', error)
      toastError('Failed to update detail location')
    }
  }

  const deleteDetailLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this detail location?')) {
      return
    }

    setDeletingDetailLocationId(id)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      const response = await fetch('/api/detail-locations', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        toastSuccess('Detail location deleted successfully')
        fetchDetailLocations()
      } else {
        // Check if it's a foreign key constraint error
        if (data.error && (data.error.includes('foreign key') || data.error.includes('constraint') || response.status === 500)) {
          toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
        } else {
          toastError(data.error || 'Failed to delete detail location')
        }
      }
    } catch (error) {
      console.error('Error deleting detail location:', error)
      // Check if it's likely a constraint error based on the error
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
        toastError('The data cannot be deleted because it is related to other data that has inventory. To delete the data, all related inventory must be deleted.')
      } else {
        toastError('Failed to delete detail location')
      }
    } finally {
      setDeletingDetailLocationId(null)
    }
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6">
      <h1 className="text-lg sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Location Management</h1>
      
      {/* Responsive layout - progressive panel wrapping */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 auto-rows-fr">
        
        {/* Buildings Panel */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-3 lg:p-4 h-[400px] sm:h-[500px] lg:h-[calc(100vh-180px)] flex flex-col">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => {
                  setSelectedBuilding(null)
                  setSelectedArea(null)
                  setSelectedFloor(null)
                }}
                title="Click to clear selection">
              Buildings
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
              {buildings.length}
            </span>
          </div>
          
          {/* Add Building Form */}
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <input
                type="text"
                placeholder="New building"
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none"
              />
              <button 
                onClick={addBuilding}
                disabled={isAddingBuilding}
                className="w-full sm:w-auto sm:flex-shrink-0 px-3 py-1.5 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isAddingBuilding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
          
          {/* Buildings List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {buildings.map((building) => (
                <div
                  key={building.id}
                  className={`p-1.5 sm:p-2 border rounded transition-colors ${
                    selectedBuilding?.id === building.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingBuildingId === building.id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={editingBuildingName}
                          onChange={(e) => setEditingBuildingName(e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateBuilding(building.id, editingBuildingName)
                            } else if (e.key === 'Escape') {
                              setEditingBuildingId(null)
                              setEditingBuildingName('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateBuilding(building.id, editingBuildingName)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingBuildingId(null)
                              setEditingBuildingName('')
                            }}
                            className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-xs sm:text-sm font-medium cursor-pointer flex-1 truncate mr-1"
                          onClick={() => {
                            setSelectedBuilding(building)
                            setSelectedArea(null)
                            setSelectedFloor(null)
                          }}
                          title={building.name}
                        >
                          {building.name}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">
                            {areas.filter(area => area.building_id === building.id).length} areas
                          </span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded sm:hidden">
                            {areas.filter(area => area.building_id === building.id).length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingBuildingId(building.id)
                              setEditingBuildingName(building.name)
                            }}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteBuilding(building.id)
                            }}
                            disabled={deletingBuildingId === building.id}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                          >
                            {deletingBuildingId === building.id ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Areas Panel */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-3 lg:p-4 h-[400px] sm:h-[500px] lg:h-[calc(100vh-180px)] flex flex-col">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate mr-2">
              <span className="hidden sm:inline">Areas</span>
              <span className="sm:hidden">Areas</span>
              {selectedBuilding && (
                <span className="hidden md:inline text-xs sm:text-sm lg:text-base"> - {selectedBuilding.name}</span>
              )}
            </h2>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
              {selectedBuilding 
                ? areas.filter(area => area.building_id === selectedBuilding.id).length
                : areas.length
              }
            </span>
          </div>
          
          {/* Add Area Form */}
          {selectedBuilding && (
            <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="New area"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none"
                />
                <button 
                  onClick={addArea}
                  disabled={isAddingArea}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isAddingArea ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}
          
          {/* Areas List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1.5 sm:space-y-2">
              {(selectedBuilding 
                ? areas.filter(area => area.building_id === selectedBuilding.id)
                : areas
              ).map((area) => (
                <div
                  key={area.id}
                  className={`p-1.5 sm:p-2 border rounded transition-colors ${
                    selectedArea?.id === area.id
                      ? 'bg-green-50 border-green-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingAreaId === area.id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={editingAreaName}
                          onChange={(e) => setEditingAreaName(e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateArea(area.id, editingAreaName)
                            } else if (e.key === 'Escape') {
                              setEditingAreaId(null)
                              setEditingAreaName('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateArea(area.id, editingAreaName)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingAreaId(null)
                              setEditingAreaName('')
                            }}
                            className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-xs sm:text-sm font-medium cursor-pointer flex-1 truncate mr-1"
                          onClick={() => {
                            setSelectedArea(area)
                            setSelectedFloor(null)
                          }}
                          title={area.name}
                        >
                          {area.name}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">
                            {floors.filter(floor => floor.area_id === area.id).length} floors
                          </span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded sm:hidden">
                            {floors.filter(floor => floor.area_id === area.id).length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingAreaId(area.id)
                              setEditingAreaName(area.name)
                            }}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteArea(area.id)
                            }}
                            disabled={deletingAreaId === area.id}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                          >
                            {deletingAreaId === area.id ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floors Panel */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-3 lg:p-4 h-[400px] sm:h-[500px] lg:h-[calc(100vh-180px)] flex flex-col">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate mr-2">
              <span className="hidden sm:inline">Floors</span>
              <span className="sm:hidden">Floors</span>
              {selectedArea && (
                <span className="hidden md:inline text-xs sm:text-sm lg:text-base"> - {selectedArea.name}</span>
              )}
            </h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
              {selectedArea 
                ? floors.filter(floor => floor.area_id === selectedArea.id).length
                : floors.length
              }
            </span>
          </div>
          
          {/* Add Floor Form */}
          {selectedArea && (
            <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="New floor"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none"
                />
                <button 
                  onClick={addFloor}
                  disabled={isAddingFloor}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-2 sm:px-3 py-1 bg-yellow-600 text-white text-xs sm:text-sm rounded hover:bg-yellow-700 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isAddingFloor ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}
          
          {/* Floors List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1.5 sm:space-y-2">
              {(selectedArea 
                ? floors.filter(floor => floor.area_id === selectedArea.id)
                : floors
              ).map((floor) => (
                <div
                  key={floor.id}
                  className={`p-1.5 sm:p-2 border rounded transition-colors ${
                    selectedFloor?.id === floor.id
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingFloorId === floor.id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={editingFloorName}
                          onChange={(e) => setEditingFloorName(e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFloor(floor.id, editingFloorName)
                            } else if (e.key === 'Escape') {
                              setEditingFloorId(null)
                              setEditingFloorName('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateFloor(floor.id, editingFloorName)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingFloorId(null)
                              setEditingFloorName('')
                            }}
                            className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-xs sm:text-sm font-medium cursor-pointer flex-1 truncate mr-1"
                          onClick={() => setSelectedFloor(floor)}
                          title={floor.name}
                        >
                          {floor.name}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">
                            {detailLocations.filter(dl => dl.floor_id === floor.id).length} locations
                          </span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded sm:hidden">
                            {detailLocations.filter(dl => dl.floor_id === floor.id).length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingFloorId(floor.id)
                              setEditingFloorName(floor.name)
                            }}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFloor(floor.id)
                            }}
                            disabled={deletingFloorId === floor.id}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                          >
                            {deletingFloorId === floor.id ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Locations Panel */}
        <div className="bg-white rounded-lg shadow p-2 sm:p-3 lg:p-4 h-[400px] sm:h-[500px] lg:h-[calc(100vh-180px)] flex flex-col">
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate mr-2">
              <span className="hidden lg:inline">Detail Locations</span>
              <span className="lg:hidden">Locations</span>
              {selectedFloor && (
                <span className="hidden md:inline text-xs sm:text-sm lg:text-base"> - {selectedFloor.name}</span>
              )}
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
              {selectedFloor 
                ? detailLocations.filter(dl => dl.floor_id === selectedFloor.id).length
                : detailLocations.length
              }
            </span>
          </div>
          
          {/* Add Detail Location Form */}
          {selectedFloor && (
            <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="New location"
                  value={newDetailLocationName}
                  onChange={(e) => setNewDetailLocationName(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none"
                />
                <button 
                  onClick={addDetailLocation}
                  disabled={isAddingDetailLocation}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-2 sm:px-3 py-1 bg-purple-600 text-white text-xs sm:text-sm rounded hover:bg-purple-700 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isAddingDetailLocation ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}
          
          {/* Detail Locations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1.5 sm:space-y-2">
              {(selectedFloor 
                ? detailLocations.filter(dl => dl.floor_id === selectedFloor.id)
                : detailLocations
              ).map((detailLocation) => (
                <div
                  key={detailLocation.id}
                  className="p-1.5 sm:p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {editingDetailLocationId === detailLocation.id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={editingDetailLocationName}
                          onChange={(e) => setEditingDetailLocationName(e.target.value)}
                          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateDetailLocation(detailLocation.id, editingDetailLocationName)
                            } else if (e.key === 'Escape') {
                              setEditingDetailLocationId(null)
                              setEditingDetailLocationName('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateDetailLocation(detailLocation.id, editingDetailLocationName)}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingDetailLocationId(null)
                              setEditingDetailLocationName('')
                            }}
                            className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm font-medium flex-1 truncate mr-1" title={detailLocation.name}>
                          {detailLocation.name}
                        </span>
                        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingDetailLocationId(detailLocation.id)
                              setEditingDetailLocationName(detailLocation.name)
                            }}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteDetailLocation(detailLocation.id)}
                            disabled={deletingDetailLocationId === detailLocation.id}
                            className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                          >
                            {deletingDetailLocationId === detailLocation.id ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>     
    </div>
  )
}
