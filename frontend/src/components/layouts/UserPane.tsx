'use client'

import { useState, useEffect } from 'react'

interface UserCounts {
  normal: number
  forgottenPassword: number
  inactive: number
}

export default function UserPane() {
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null) 

  useEffect(() => {
    const fetchUserCounts = async () => { 
        const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        const response = await fetch('/api/users/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })       

          const data = await response.json()
          if (data.success) {
            setUserCounts({
              normal: data.normal || 0,
              forgottenPassword: data.forgottenPassword || 0,
              inactive: data.inactive || 0
            })          
          } 
    }
    fetchUserCounts()
  }, []) 

  const getDisplayCount = (count: number | undefined) => {  
    return count !== null && count !== undefined ? count.toLocaleString() : '0'
  }

  return (
    <div className="bg-white rounded-lg border border-[#cccccc] shadow p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">USERS</h2>      
        
          <div className="flex items-center justify-between">            
            <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-[#029b68]">
               Normal : {getDisplayCount(userCounts?.normal)}
            </span>
            <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
               Forgot Password : {getDisplayCount(userCounts?.forgottenPassword)}
            </span>
             <span className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-[#d9e0e6] text-grey-700 border border-[#a8b1b8]">
               Inactive : {getDisplayCount(userCounts?.inactive)}
            </span>
          </div>
              
    </div>
  )
}
