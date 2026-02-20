'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface SearchResult {
  id: number
  itemName: string
  barcode: string
  location: string
  status: string
  statusColor: string
  isThrow: string
  deploymentDate: string
  category: string
}

interface GlobalSearchProps {
  className?: string
}

export default function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounced search function
  const debouncedSearch = useMemo(() => 
    debounce(async (term: string) => {
      if (term.trim().length === 0) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const token = localStorage.getItem('auth-token') || 
                     document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success) {
          setResults(data.results || [])
          setIsOpen(true)
        } else {
          setError(data.error || 'Search failed')
        }
      } catch (err) {
        console.error('Search error:', err)
        setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 300),
    [setResults, setIsOpen, setLoading, setError]
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const closeDialog = () => {
    setIsOpen(false)
    setSearchTerm('')
    setResults([])
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search inventory by item name or barcode..."
          className="w-full max-w-[350px] text-[14px] pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Image 
              src="/6-dots-spinner.svg" 
              alt="Searching" 
              width={16}
              height={16}
              className="animate-spin"
            />
          </div>
        )}
      </div>

      {/* Search Results Dialog */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Dialog */}
          <div className="fixed inset-x-2 sm:inset-x-4 top-16 sm:top-20 bottom-4 bg-white rounded-lg shadow-2xl border-1 border-gray-400 z-[120] flex flex-col max-w-6xl mx-auto">
            {/* Dialog Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {loading ? 'Searching...' : 
                   error ? error :
                   results.length === 0 ? 'No results found' :
                   `Found ${results.length} item${results.length !== 1 ? 's' : ''} matching "${searchTerm}"`}
                </p>
              </div>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Results Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-500">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                            Barcode
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                            Is Throw
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                            Deployment Date
                          </th>
                        </tr>
                      </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-2 whitespace-nowrap min-w-[200px]">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.itemName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.category}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap min-w-[150px]">
                                <div className="text-sm font-mono text-gray-900">{item.barcode}</div>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap min-w-[200px]">
                                <div className="text-sm text-gray-900">{item.location}</div>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap min-w-[100px]">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.statusColor === 'green' 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.statusColor === 'yellow'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : item.statusColor === 'red'
                                    ? 'bg-red-100 text-red-800'
                                    : item.statusColor === 'purple'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap min-w-[80px]">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.isThrow === 'Yes' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {item.isThrow}
                                </span>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">
                                {item.deploymentDate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// Debounce utility function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
