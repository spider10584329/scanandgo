'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AdminPage() {
  const { user, isLoading } = useAuth('admin')
  const router = useRouter()

  // Redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/admin/dashboard')
    }
  }, [isLoading, user, router])

  // This page just redirects to dashboard, no need for additional content
  return null
}