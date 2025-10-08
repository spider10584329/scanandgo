'use client'

import { useState, useEffect, useRef } from 'react'

interface Category {
  id: number
  name: string
}

interface CategorySelectProps {
  selectedCategory: Category | null
  onCategorySelect: (category: Category | null) => void
}

export default function CategorySelect({ selectedCategory, onCategorySelect }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch categories from API
  useEffect(() => {
    fetchCategories()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCategorySelect = (category: Category | null) => {
    onCategorySelect(category)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  return (
    <>
      {/* Sophisticated Category Select */}
      <div className="relative" ref={dropdownRef}>
        {/* Main Select Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={loading}
          className={`
            relative w-full bg-white border border-gray-400 rounded-sm  pl-5 pr-10 py-2 text-left cursor-pointer
            focus:outline-none 
            hover:border-gray-500 transition-all duration-200
            
          `}
        >
          <div className="flex items-center">            
            <div className="flex-1 min-w-0">
              <span className={`block text-sm font-medium ${selectedCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                {loading ? 'Loading categories...' : selectedCategory ? selectedCategory.name : 'Choose a category'}
              </span>
            </div>
          </div>
          
          {/* Dropdown Arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-400 overflow-hidden">
            {/* Search Input */}
            <div className="pt-2 pb-2 px-4 ">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Options List */}
            <div className="max-h-64 overflow-y-auto px-4 pb-2"> 
              <button
                type="button"
                onClick={() => handleCategorySelect(null)}
                className={`
                    w-full px-2 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150 text-sm
                    
                `}
                >
                <div className="flex items-center justify-between  text-gray-400  hover:text-gray-600">
                    <span>Clear Selection</span>
                    <div className={`
                    flex-shrink-0 w-6 h-6 rounded flex items-center justify-center                  
                    `}>
                    <svg 
                        className={`w-4 h-4`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </div>                
                </div>
               </button>               
              {/* Category Options */}
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className={`
                      w-full px-2 py-2 text-left rounded-md hover:bg-gray-100 transition-colors duration-150
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      {selectedCategory?.id === category.id && (
                        <div className="flex-shrink-0">✔</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? (
                    <>
                      <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm">No categories found</p>
                      <p className="text-xs">Try adjusting your search</p>
                    </>
                  ) : (
                    <>
                      <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-sm">No categories available</p>
                      <p className="text-xs">Create your first category to get started</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
