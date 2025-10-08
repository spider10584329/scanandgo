'use client'

import { useState } from 'react'
import CategorySelect from '@/components/inventory/CategorySelect'
import ItemsList from '@/components/inventory/ItemsList'
import LocationSelect from '@/components/inventory/LocationSelect'
import InventoryTable from '@/components/inventory/InventoryTable'

interface Category {
  id: number
  name: string
}

interface LocationData {
  id: number
  name: string
}

export default function InventoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<LocationData | null>(null)
  const [selectedArea, setSelectedArea] = useState<LocationData | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<LocationData | null>(null)
  const [selectedDetailLocation, setSelectedDetailLocation] = useState<LocationData | null>(null)

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category)
  }

  const handleBuildingSelect = (building: LocationData | null) => {
    setSelectedBuilding(building)
    // Reset dependent selections
    setSelectedArea(null)
    setSelectedFloor(null)
    setSelectedDetailLocation(null)
  }

  const handleAreaSelect = (area: LocationData | null) => {
    setSelectedArea(area)
    // Reset dependent selections
    setSelectedFloor(null)
    setSelectedDetailLocation(null)
  }

  const handleFloorSelect = (floor: LocationData | null) => {
    setSelectedFloor(floor)
    // Reset dependent selections
    setSelectedDetailLocation(null)
  }

  const handleDetailLocationSelect = (detailLocation: LocationData | null) => {
    setSelectedDetailLocation(detailLocation)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-19 gap-6">
        {/* Category Pane */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-180px)]">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Category</h2>
            
            {/* Category Select */}
            <div className="mb-6">
                <CategorySelect 
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                />              
            </div>

            {/* Items List */}
            <ItemsList 
              selectedCategory={selectedCategory}
              onDragStart={(items) => console.log('Dragging items:', items)}
            />
          </div>
        </div>

        {/* Inventory Pane */}
        <div className="lg:col-span-15">
          <div className="space-y-6">
            {/* Location Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Location Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <LocationSelect
                  type="building"
                  value={selectedBuilding}
                  onChange={handleBuildingSelect}
                  placeholder="Select Building"
                />
                <LocationSelect
                  type="area"
                  value={selectedArea}
                  onChange={handleAreaSelect}
                  parentId={selectedBuilding?.id}
                  placeholder="Select Area"
                />
                <LocationSelect
                  type="floor"
                  value={selectedFloor}
                  onChange={handleFloorSelect}
                  parentId={selectedArea?.id}
                  placeholder="Select Floor"
                />
                <LocationSelect
                  type="detail_location"
                  value={selectedDetailLocation}
                  onChange={handleDetailLocationSelect}
                  parentId={selectedFloor?.id}
                  placeholder="Select Detail Location"
                />
              </div>
              
             
            </div>

            {/* Inventory Table */}
            <InventoryTable
              selectedBuilding={selectedBuilding}
              selectedArea={selectedArea}
              selectedFloor={selectedFloor}
              selectedDetailLocation={selectedDetailLocation}
              onItemsAdded={() => console.log('Items successfully added to inventory')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
