'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ProtectedPageLoading } from '@/components/auth/ProtectedPageLoading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Scan, 
  Package, 
  ClipboardCheck, 
  Truck, 
  MapPin,
  Activity,
  CheckCircle
} from 'lucide-react'

export default function AgentHome() {
  const router = useRouter()
  const { isLoading, isAuthorized, session } = useRoleProtection({
    allowedRoles: ['admin', 'manager', 'agent']
  })

  // Show loading while verifying access
  if (isLoading || !isAuthorized) {
    return <ProtectedPageLoading color="border-purple-600" message="Verifying agent access..." />
  }

  const agentFeatures = [
    {
      title: 'Agent Dashboard',
      description: 'View your tasks and daily overview',
      icon: LayoutDashboard,
      path: '/agent/dashboard',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Scan & Process',
      description: 'Scan items and process orders',
      icon: Scan,
      path: '/agent/scan',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Inventory Tasks',
      description: 'Complete inventory-related tasks',
      icon: Package,
      path: '/agent/inventory',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Task Management',
      description: 'View and complete assigned tasks',
      icon: ClipboardCheck,
      path: '/agent/tasks',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Delivery Tracking',
      description: 'Track deliveries and shipments',
      icon: Truck,
      path: '/agent/delivery',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Location Services',
      description: 'Manage location-based activities',
      icon: MapPin,
      path: '/agent/location',
      color: 'bg-teal-500 hover:bg-teal-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Workspace</h1>
              <p className="text-gray-600">Welcome, {session?.user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4" />
                <span>Agent</span>
              </div>
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <Activity className="h-5 w-5 mr-2" />
                  Agent Operations Center
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Access your daily tasks, scan operations, and workflow management tools. Choose a section below to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agentFeatures.map((feature) => (
              <Card key={feature.path} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${feature.color} text-white`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className={`w-full ${feature.color} text-white`}
                    onClick={() => router.push(feature.path)}
                  >
                    Access {feature.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/agent/dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/agent/scan')}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/agent/tasks')}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
