'use client'

import { useState, useEffect, useCallback } from 'react'

interface InventoryItem {
  id: number
  purchase_date?: string
  last_date?: string
  ref_client?: string
  status?: number
  reg_date?: string
  inv_date?: string
  comment?: string
  rfid?: string
  barcode?: string
  operator_id?: number
  room_assignment?: string
  category_df_immonet?: string
  purchase_amount?: number
  is_throw?: boolean
  // Relations
  items?: {
    id: number
    name: string
    barcode?: string
  }
  categories?: {
    id: number
    name: string
  }
}

interface LocationData {
  id: number
  name: string
}

interface InventoryTableProps {
  selectedBuilding: LocationData | null
  selectedArea: LocationData | null
  selectedFloor: LocationData | null
  selectedDetailLocation: LocationData | null
}

export default function InventoryTable({ 
  selectedBuilding, 
  selectedArea, 
  selectedFloor, 
  selectedDetailLocation 
}: InventoryTableProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchInventoryItems = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        console.error('No authentication token found')
        return
      }

      // Build query parameters based on selected locations
      const params = new URLSearchParams()
      if (selectedBuilding) params.append('building_id', selectedBuilding.id.toString())
      if (selectedArea) params.append('area_id', selectedArea.id.toString())
      if (selectedFloor) params.append('floor_id', selectedFloor.id.toString())
      if (selectedDetailLocation) params.append('detail_location_id', selectedDetailLocation.id.toString())

      const url = `/api/inventories${params.toString() ? '?' + params.toString() : ''}`

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
      if (data.success && data.inventories) {
        setInventoryItems(data.inventories)
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedBuilding, selectedArea, selectedFloor, selectedDetailLocation])

  useEffect(() => {
    fetchInventoryItems()
  }, [fetchInventoryItems])

  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const getStatusDisplay = (status?: number) => {
    const statusMap: Record<number, { label: string, color: string }> = {
      0: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Active', color: 'bg-green-100 text-green-800' },
      2: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: 'Retired', color: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = status !== undefined ? statusMap[status] : null
    return statusInfo ? (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    ) : (
      <span className="text-gray-400 text-sm">-</span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow h-[calc(100vh-370px)] ">
        <div className="px-6 py-4  border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
        </div>

        {inventoryItems.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden mx-6 mb-6">
            <table className="min-w-full ">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {inventoryItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {item.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.items?.name || 'Unknown Item'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-gray-500">
                        {item.barcode || item.items?.barcode || 'No barcode'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRowClick(item)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-gray-400 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-sm text-gray-500">
              No items match your current location filters.
            </p>
          </div>
        )}
      </div>

      {/* Modal for detailed view */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Inventory Item Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <p className="text-sm text-gray-900">{selectedItem.items?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedItem.categories?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Barcode</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedItem.barcode || selectedItem.items?.barcode || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">RFID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedItem.rfid || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusDisplay(selectedItem.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Is Throw</label>
                  <div className="mt-1">
                    {selectedItem.is_throw ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <p className="text-sm text-gray-900">{selectedItem.purchase_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Date</label>
                  <p className="text-sm text-gray-900">{selectedItem.last_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="text-sm text-gray-900">{selectedItem.reg_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory Date</label>
                  <p className="text-sm text-gray-900">{selectedItem.inv_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference Client</label>
                  <p className="text-sm text-gray-900">{selectedItem.ref_client || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Assignment</label>
                  <p className="text-sm text-gray-900">{selectedItem.room_assignment || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Amount</label>
                  <p className="text-sm text-gray-900">
                    {selectedItem.purchase_amount ? `$${selectedItem.purchase_amount}` : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedItem.comment && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Comment</label>
                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedItem.comment}
                </p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
