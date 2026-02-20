'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export default function AgentPage() {
  const { user, isLoading } = useAuth('agent')
  const router = useRouter()

  // Redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/agent/dashboard')
    }
  }, [isLoading, user, router])

  // Show loading while redirecting
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Image 
            src="/6-dots-spinner.svg" 
            alt="Loading..." 
            width={48} 
            height={48} 
            className="mx-auto mb-4"
          />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}