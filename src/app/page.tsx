'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import UserLogin from '@/components/UserLogin'
import ManagerLogin from '@/components/ManagerLogin'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState('user')
  const { clearStaleTokens } = useAuthContext()

  // Clear any stale tokens when landing on home page
  useEffect(() => {
    clearStaleTokens()
  }, [clearStaleTokens])

  return (
    <div className="min-h-screen bg-gray-400 flex items-center justify-center p-8">
      <div className="bg-white border border-gray-300 rounded-2xl p-8 w-96 h-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <Image 
            src="/logo.webp" 
            alt="Scanandgo Logo" 
            width={64}
            height={64}
            className="mx-auto h-16 w-auto"
          />
        </div>
        
        {/* Tab Panel */}
        <div className="bg-gray-100 border border-gray-300 rounded-2xl">
          
          <div className="flex">
            <button 
              className={`px-8 py-2 text-sm border-r border-gray-300  rounded-tl-2xl ${
                activeTab === 'user' 
                  ? 'bg-white border-b-0 font-bold' 
                  : 'bg-gray-100'
              }`}
              onClick={() => setActiveTab('user')}
            >
              USER
            </button>
            <button 
              className={`px-4 py-2 text-sm  ${
                activeTab === 'manager' 
                  ? 'bg-white border-b-0 font-bold' 
                  : 'bg-gray-100'
              }`}
              onClick={() => setActiveTab('manager')}
            >
              MANAGER
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white border-t border-gray-300  p-4 relative rounded-b-2xl h-auto">
            {activeTab === 'user' && <UserLogin />}
            {activeTab === 'manager' && <ManagerLogin />}
          </div>
        </div>
      </div>
    </div>
  )
}
