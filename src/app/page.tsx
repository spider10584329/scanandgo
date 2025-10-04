'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import { useSessionCleanup } from '@/hooks/useSessionCleanup'



export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  
  // Enable session cleanup on browser close and inactivity
  useSessionCleanup()

  // Initialize database on first visit
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)
        
        console.log('🔍 Initializing database on site visit...')
        
        const response = await fetch('/api/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error('Database initialization failed')
        }
        
        const result = await response.json()
        console.log('✅ Database initialized:', result.message)
        
      } catch (error) {
        console.error('❌ Database initialization error:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsInitializing(false)
      }
    }   
    initializeDatabase()
  }, [])

  
  useEffect(() => {
    if (status === 'loading' || isInitializing) return
    
    console.log('🏠 Homepage: Session status:', status, 'User:', session?.user?.email, 'Role:', (session as any)?.user?.role) // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (session && (session as any)?.user?.role) { // eslint-disable-line @typescript-eslint/no-explicit-any     
      const roleHomePage = (() => {
        switch ((session as any)?.user?.role) { // eslint-disable-line @typescript-eslint/no-explicit-any
          case 'admin':
            return '/admin'
          case 'manager':
            return '/manager'
          case 'agent':
            return '/agent'
          case 'user':
            return '/user'
          default:
            return '/auth/signin'
        }
      })()
      console.log('🏠 Homepage: Redirecting to role-specific page:', roleHomePage)
      router.push(roleHomePage)
    } else if (session && !(session as any)?.user?.role) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('🏠 Homepage: User has no role, staying on homepage')
    }
  }, [session, status, router, isInitializing])

  // Show loading during initialization or session loading
  if (status === 'loading' || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isInitializing ? 'Initializing database...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error if database initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Initialization Failed</h1>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect
  }

  return <AuthForm mode="signin" />
}
