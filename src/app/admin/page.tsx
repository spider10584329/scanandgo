'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  UserCheck,
  Activity
} from 'lucide-react'

export default function AdminHome() {
  const router = useRouter()
  const { data: session } = useSession()
  
  // Simple admin page - middleware already protects this route

  const adminFeatures = [
    {
      title: 'Dashboard',
      description: 'View system overview and analytics',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'User Management',
      description: 'Manage users, roles and permissions',
      icon: Users,
      path: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Analytics & Reports',
      description: 'View detailed system analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Security Center',
      description: 'Manage security policies and logs',
      icon: Shield,
      path: '/admin/security',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Database Management',
      description: 'Database operations and maintenance',
      icon: Database,
      path: '/admin/database',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Center</h1>
              <p className="text-gray-600">Welcome, {session?.user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Administrator</span>
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
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <UserCheck className="h-5 w-5 mr-2" />
                  System Administrator Access
                </CardTitle>
                <CardDescription className="text-blue-700">
                  You have full administrative access to the ScanAndGo system. Choose a section below to manage.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminFeatures.map((feature) => (
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
                  <Activity className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/admin/dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/admin/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
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
