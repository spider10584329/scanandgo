'use client'
import ItemsPane from '@/components/layouts/ItemsPane'
import MissingPane from '@/components/layouts/MissingPane'
import InventoryPane from '@/components/layouts/InventoryPane'
import BreakagePane from '@/components/layouts/BreakagePane'
import UserPane from '@/components/layouts/UserPane'
import ClientnamePane from '@/components/layouts/ClientnamePane'
export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Two panels in a row with different sizes */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6 mb-8">
         <div className="md:col-span-2">
           <ClientnamePane />
         </div>
       
        <div className="md:col-span-3">
          <UserPane />
        </div>
      </div>
      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">       
          <ItemsPane />
          <MissingPane />
          <InventoryPane />
          <BreakagePane />          
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Additional dashboard functionality will be implemented here.</p>
      </div>
    </div>
  )
}
