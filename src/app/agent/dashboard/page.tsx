'use client'
import ItemsPane from '@/components/layouts/ItemsPane'
import BreakagePane from '@/components/layouts/BreakagePane'
import ClientnamePane from '@/components/layouts/ClientnamePane'
import InventoryStatusChart from '@/components/dashboard/InventoryStatusChart'
import LocationAnalytics from '@/components/dashboard/LocationAnalytics'
export default function AdminDashboard() {
  return (
    <div className="p-3 sm:p-4 lg:p-6 ">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Dashboard</h1>
      
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 h-[calc(100vh-210px)]">
        {/* Left Sidebar - Stacked on mobile, sidebar on desktop */}
        <div className="w-full xl:w-80 2xl:w-96 space-y-4">
          {/* Client Name */}
          <ClientnamePane />
          
          {/* Items Count */}
          <ItemsPane />
          
          {/* Inventory Status Chart */}
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Inventory situation
            </h2>
            <div className="w-full max-w-xs mx-auto lg:max-w-none">
              <InventoryStatusChart />
            </div>
          </div>
          
          {/* Breakage */}
          <BreakagePane />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow p-4 lg:p-6 h-[60vh] sm:h-[70vh] xl:h-[calc(100vh-180px)] flex flex-col">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Items by Location
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              <LocationAnalytics />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
