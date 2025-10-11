'use client'
import ItemsPane from '@/components/layouts/ItemsPane'
import BreakagePane from '@/components/layouts/BreakagePane'
import ClientnamePane from '@/components/layouts/ClientnamePane'
import InventoryStatusChart from '@/components/dashboard/InventoryStatusChart'
import LocationAnalytics from '@/components/dashboard/LocationAnalytics'
export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className='grid grid-cols-1 md:grid-cols-9 lg:grid-cols-9 gap-6'>
              <div className="md:col-span-2">
                <ClientnamePane />
                <div className='mt-4'>
                  <ItemsPane />
                </div>                
                <div className="bg-white rounded-lg shadow p-6 mt-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory situation</h2>
                  <InventoryStatusChart />
                </div> 
                <div className='mt-4'>
                  <BreakagePane />  
                </div>
              </div>
            
              <div className="md:col-span-7">
                <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-180px)] flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Items by Location</h2>
                  <div className="flex-1 overflow-y-auto">
                    <LocationAnalytics />
                  </div>
                </div>
              </div>
        </div>
    </div>
  )
}
