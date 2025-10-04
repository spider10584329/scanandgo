'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ProtectedPageLoading } from '@/components/auth/ProtectedPageLoading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings, UserCheck, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { isLoading, isAuthorized, session } = useRoleProtection({
    allowedRoles: ['admin']
  })

  // Show loading while verifying access
  if (isLoading || !isAuthorized) {
    return <ProtectedPageLoading color="border-blue-600" message="Verifying admin dashboard access..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session?.user?.email}</p>
            </div>
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Users awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Managers</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Active managers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Admin Controls</CardTitle>
                <CardDescription>
                  Manage users, roles, and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 mb-2" />
                    User Management
                  </Button>
                  <Button className="h-20 flex flex-col items-center justify-center" variant="outline">
                    <Shield className="h-6 w-6 mb-2" />
                    Role Management
                  </Button>
                  <Button className="h-20 flex flex-col items-center justify-center" variant="outline">
                    <Settings className="h-6 w-6 mb-2" />
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
