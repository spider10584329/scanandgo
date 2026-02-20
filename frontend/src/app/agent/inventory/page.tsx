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
  const [refreshItemsKey, setRefreshItemsKey] = useState(0)
  const [refreshInventoryKey, setRefreshInventoryKey] = useState(0)

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

  const handleItemsAdded = () => {
    console.log('Items successfully added to inventory')
    // Trigger refresh of both ItemsList and InventoryTable
    setRefreshItemsKey(prev => prev + 1)
    setRefreshInventoryKey(prev => prev + 1)
  }

  const handleInventoryChanged = () => {
    console.log('Inventory changed - refreshing items list')
    // Trigger refresh of ItemsList when inventory changes (items removed)
    setRefreshItemsKey(prev => prev + 1)
  }

  return (
    <div className="p-4 sm:p-4 lg:p-6">
      <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Inventory Management</h1>
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Category Pane - Controlled width reduction */}
        <div className="lg:col-span-4 xl:col-span-3 lg:min-w-0">
          <div className="bg-white rounded-lg shadow p-4 sm:p-4 lg:p-6 h-[400px] sm:h-[500px] lg:h-[calc(100vh-180px)] flex flex-col">
            <h2 className="text-md sm:text-lg lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex-shrink-0">Category</h2>
            
            {/* Category Select */}
            <div className="mb-3 sm:mb-4 lg:mb-6 flex-shrink-0">
                <CategorySelect 
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                />              
            </div>

            {/* Items List - Flex-1 to take remaining space */}
            <ItemsList 
              selectedCategory={selectedCategory}
              selectedBuilding={selectedBuilding}
              selectedArea={selectedArea}
              selectedFloor={selectedFloor}
              selectedDetailLocation={selectedDetailLocation}
              refreshTrigger={refreshItemsKey}
              onDragStart={(items) => console.log('Dragging items:', items)}
              onItemsAdded={handleItemsAdded}
            />
          </div>
        </div>

        {/* Inventory Pane */}
        <div className="lg:col-span-8 xl:col-span-9 lg:min-w-0">
          <div className="space-y-3 sm:space-y-3 lg:space-y-6">
            {/* Location Filters */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-4 lg:p-6">
              <h2 className="text-lg sm:text-lg lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Location Filters</h2>
              {/* Progressive responsive grid: 4 cols on XL+, 2 cols on SM-LG, 1 col on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {/* Building & Area Row */}
                <div className="xl:contents">
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
                </div>
                
                {/* Floor & Detail Location Row */}
                <div className="xl:contents">
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
            </div>

            {/* Inventory Table */}
            <InventoryTable
              selectedBuilding={selectedBuilding}
              selectedArea={selectedArea}
              selectedFloor={selectedFloor}
              selectedDetailLocation={selectedDetailLocation}
              refreshTrigger={refreshInventoryKey}
              onItemsAdded={handleItemsAdded}
              onInventoryChanged={handleInventoryChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
