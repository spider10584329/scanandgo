'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClientNameContext } from '@/contexts/ClientNameContext'

export function useClientName() {
  const [clientName, setClientName] = useState<string>('SCANANDGO')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { registerRefreshCallback, unregisterRefreshCallback } = useClientNameContext()

  const fetchClientName = useCallback(async () => {
    const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
    
    if (!token) {
      setClientName('SCANANDGO')
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/client', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })       
      
      const data = await response.json()
      if (data.success) {
        setClientName(data.clientname || 'SCANANDGO')
      } else {
        setClientName('SCANANDGO')
      }
    } catch (error) {
      console.error('Error fetching client name:', error)
      setClientName('SCANANDGO')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshClientName = useCallback(() => {
    setIsLoading(true)
    fetchClientName()
  }, [fetchClientName])

  useEffect(() => {
    fetchClientName()
    registerRefreshCallback(refreshClientName)
    
    return () => {
      unregisterRefreshCallback(refreshClientName)
    }
  }, [fetchClientName, registerRefreshCallback, unregisterRefreshCallback, refreshClientName])

  return {
    clientName: clientName.toUpperCase(), // Always display in uppercase
    isLoading,
    refreshClientName
  }
}
