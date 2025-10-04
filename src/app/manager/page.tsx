'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ProtectedPageLoading } from '@/components/auth/ProtectedPageLoading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  FileBarChart, 
  Package, 
  Truck, 
  ClipboardList,
  TrendingUp,
  Calendar
} from 'lucide-react'

export default function ManagerHome() {
  const router = useRouter()
  const { isLoading, isAuthorized, session } = useRoleProtection({
    allowedRoles: ['admin', 'manager']
  })

  // Show loading while verifying access
  if (isLoading || !isAuthorized) {
    return <ProtectedPageLoading color="border-green-600" message="Verifying manager access..." />
  }

  const managerFeatures = [
    {
      title: 'Manager Dashboard',
      description: 'View operational overview and KPIs',
      icon: LayoutDashboard,
      path: '/manager/dashboard',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Team Management',
      description: 'Manage agents and staff',
      icon: Users,
      path: '/manager/team',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate and view performance reports',
      icon: FileBarChart,
      path: '/manager/reports',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Inventory Overview',
      description: 'Monitor inventory levels and status',
      icon: Package,
      path: '/manager/inventory',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Operations',
      description: 'Oversee daily operations and workflows',
      icon: Truck,
      path: '/manager/operations',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Planning & Scheduling',
      description: 'Manage schedules and planning',
      icon: Calendar,
      path: '/manager/planning',
      color: 'bg-teal-500 hover:bg-teal-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Center</h1>
              <p className="text-gray-600">Welcome, {session?.user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
                <span>Manager</span>
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
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Management Dashboard
                </CardTitle>
                <CardDescription className="text-green-700">
                  Manage your team, oversee operations, and track performance metrics. Choose a section below to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {managerFeatures.map((feature) => (
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
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/manager/dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/manager/team')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/manager/reports')}
                  >
                    <FileBarChart className="h-4 w-4 mr-2" />
                    View Reports
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
