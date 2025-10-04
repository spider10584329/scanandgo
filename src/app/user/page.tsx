'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ProtectedPageLoading } from '@/components/auth/ProtectedPageLoading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, Mail } from 'lucide-react'

export default function UserHome() {
  const router = useRouter()
  const { isLoading, isAuthorized, session } = useRoleProtection({
    allowedRoles: ['admin', 'manager', 'agent', 'user'] // All authenticated users
  })

  // Show loading while verifying access
  if (isLoading || !isAuthorized) {
    return <ProtectedPageLoading color="border-orange-600" message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Home</h1>
              <p className="text-gray-600">Welcome, {session?.user?.email}</p>
            </div>
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Account Pending Approval
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Your account is awaiting approval from an administrator. You will receive access to additional features once approved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-800">Status: Pending</p>
                    <p className="text-sm text-orange-600">
                      Please wait for admin approval to access full features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your current account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{session?.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-lg capitalize">{session?.user?.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Pending Approval
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>What happens next</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Account Review</p>
                    <p className="text-sm text-gray-500">Admin will review your account request</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Role Assignment</p>
                    <p className="text-sm text-gray-400">You'll be assigned appropriate permissions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Notification</p>
                    <p className="text-sm text-gray-400">You'll receive an email when approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
