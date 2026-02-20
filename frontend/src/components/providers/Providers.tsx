'use client'

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import SessionManager from '@/components/auth/SessionManager'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SessionManager />
      {children}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AuthProvider>
  )
}
