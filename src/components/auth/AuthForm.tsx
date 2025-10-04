'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSessionCleanup } from '@/hooks/useSessionCleanup'


interface AuthFormProps {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Clean up any stale session data
  const { cleanupSession } = useSessionCleanup()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Form submitted! Mode:', mode, 'Email:', email)
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        // Validate password confirmation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // After successful registration, sign in the user
        const signInResult = await signIn('credentials', {
          username: email,
          password,
          redirect: false
        })

        if (signInResult?.error) {
          toast.error('Registration successful but automatic login failed. Please sign in manually.', {
            duration: 5000,
            position: 'bottom-right',
          })
          router.push('/auth/signin')
          return
        }

        // After successful registration, redirect and let NextAuth handle the session
        console.log('✅ Registration successful, redirecting to dashboard')
        
        toast.success('Registration successful! Redirecting...', {
          duration: 3000,
          position: 'bottom-right',
        })
        
        // Use window.location for full page reload to ensure session is properly established
        window.location.href = '/dashboard'
      } else {
        console.log('🔐 Attempting sign-in for user:', email)
        
        try {
          // Clean up any existing session data before new login
          cleanupSession()
          
          const result = await signIn('credentials', {
            username: email,
            password,
            redirect: false
          })

          console.log('🔍 Sign-in result:', result)

          // Check for authentication success
          if (result?.ok && !result?.error) {
            console.log('✅ Sign-in successful')
            toast.success('Sign-in successful! Redirecting...', {
              duration: 2000,
              position: 'bottom-right',
            })
            
            // Simple redirect - let the homepage handle role-based routing
            setTimeout(() => {
              window.location.href = '/'
            }, 500)
            return
          }

          // Handle authentication failures without showing form errors
          if (result?.error) {
            console.error('❌ Sign-in failed:', result.error)
            
            // Show only toast notification - no form error display
            let toastMessage = 'Invalid email or password. Please try again.'
            if (result.error === 'CredentialsSignin') {
              toastMessage = 'Invalid email or password. Please check your credentials.'
            }
            
            toast.error(toastMessage, {
              duration: 4000,
              position: 'bottom-right',
            })
            return
          }

          // Fallback for unexpected result
          toast.error('Sign-in failed. Please try again.', {
            duration: 4000,
            position: 'bottom-right',
          })

        } catch (authError) {
          // Catch any unexpected errors during sign-in
          console.error('❌ Unexpected sign-in error:', authError)
          toast.error('Sign-in failed. Please try again later.', {
            duration: 4000,
            position: 'bottom-right',
          })
        }
      }
    } catch (err) {
      console.error('❌ Form submission error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      
      // Only show form errors for validation issues, not authentication failures
      if (mode === 'signup' || (err instanceof Error && !err.message.includes('sign-in'))) {
        setError(errorMessage)
      }
      
      // Always show toast notification
      toast.error(errorMessage, {
        duration: 4000,
        position: 'bottom-right',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            ScanAndGo
          </CardTitle>
          <CardDescription>
            {mode === 'signin' 
              ? 'Welcome back! Sign in to your account' 
              : 'Create your new account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={6}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  minLength={6}
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (mode === 'signup' && password !== confirmPassword)}
            >
              {loading 
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'signin' ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => router.push(mode === 'signin' ? '/auth/signup' : '/auth/signin')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {mode === 'signin' ? 'Create one here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Toast notifications container */}
      <Toaster />
    </div>
  )
}
