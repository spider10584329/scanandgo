'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AgentPage() {
  const { user, isLoading } = useAuth('agent')
  const router = useRouter()

  // Redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/agent/dashboard')
    }
  }, [isLoading, user, router])

  // This page just redirects to dashboard, no need for additional content
  return null
}