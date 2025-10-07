'use client'
import CategoryPane from '@/components/layouts/CategoryPane'
import LocationPane from '@/components/layouts/LocationPane'
import InventoryPane from '@/components/layouts/InventoryPane'
import UserPane from '@/components/layouts/UserPane'
export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Four panels in a row */}
      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">       
          <CategoryPane />
          <LocationPane />
          <InventoryPane />
          <UserPane />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Additional dashboard functionality will be implemented here.</p>
      </div>
    </div>
  )
}
