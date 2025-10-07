'use client'

import { useState, useEffect } from 'react'
import { toastError, toastSuccess } from '@/components/ui/toast'
interface Category {
  id: number
  customer_id: number
  name: string
}

interface Item {
  id: number
  customer_id: number
  category_id: number | null
  name: string
  barcode: string | null
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items] = useState<Item[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemBarcode, setNewItemBarcode] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      } else {
        toastError(data.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toastError('Failed to load categories')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toastError('Please enter a category name')
      return
    }

    setIsAdding(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
     
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName.trim()
        })
      })

      const data = await response.json()
      
   
      
      if (response.ok && data.success) {
        // Add new category to the list
        setCategories(prev => [...prev, data.category])
        setNewCategoryName('')      
        toastSuccess(`Category "${data.category.name}" added successfully!`)
      } else {
        // Handle specific error messages, especially duplicates     
        if (response.status === 409 || data.error?.includes('already exists')) {     
          toastError(`Category "${newCategoryName.trim()}" already exists!`)
        } else {
           toastError(data.error || 'Failed to add category')
        }
      }
    } catch {      
      toastError('Failed to add category')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return
    }
    setDeletingCategoryId(categoryId)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: categoryId
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Remove category from the list
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
        
        // Clear selected category if it was the deleted one
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(null)
        }
        
        toastSuccess(`Category "${categoryName}" deleted successfully!`)
      } else {
        // Handle specific error messages
        if (response.status === 409) {
          toastError(data.error || 'Cannot delete category with items')
        } else {
          toastError(data.error || 'Failed to delete category')
        }
      }
    } catch {    
      toastError('Failed to delete category')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
  }

  const handleSaveEditCategory = async () => {
    if (!editingCategoryName.trim()) {
      toastError('Please enter a category name')
      return
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingCategoryId,
          name: editingCategoryName.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Update category in the list
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategoryId 
            ? { ...cat, name: data.category.name }
            : cat
        ))
        
        // Update selected category if it was the edited one
        if (selectedCategory?.id === editingCategoryId) {
          setSelectedCategory(prev => prev ? { ...prev, name: data.category.name } : null)
        }
        
        // Reset edit state
        setEditingCategoryId(null)
        setEditingCategoryName('')
        
        toastSuccess(`Category updated to "${data.category.name}" successfully!`)
      } else {
        // Handle specific error messages, especially duplicates
        if (response.status === 409) {
          toastError(`Category "${editingCategoryName.trim()}" already exists!`)
        } else {
          toastError(data.error || 'Failed to update category')
        }
      }
    } catch {    
      toastError('Failed to update category')
    }
  }

  const handleCancelEdit = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Category Management</h1>
      
      {/* Two panels side by side - 1/3 and 2/3 split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Categories Panel - 1/3 width */}
        <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-180px)] flex flex-col md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => setSelectedCategory(null)}
              title="Click to clear selection"
            >
              Categories
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded">
              total : {categories.length}
            </span>
          </div>
          
          {/* Add Category Form */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2">
              <input
                id="category-name"
                type="text"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-400 rounded-md focus:outline-none "
              />
              <button 
                onClick={handleAddCategory}
                disabled={isAdding}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none  disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
          
          {/* Categories List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 border rounded-lg border-gray-200 transition-colors ${
                    editingCategoryId === category.id
                      ? 'bg-blue-50 border-blue-300'
                      : selectedCategory?.id === category.id
                      ? 'text-[#000000] bg-gray-100 border-gray-400 cursor-pointer'
                      : 'text-[#000000] hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => editingCategoryId !== category.id && setSelectedCategory(category)}
                >
                  {editingCategoryId === category.id ? (
                    // Edit mode - professional inline editing
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-400 rounded-md focus:outline-none "
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditCategory()
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-between items-center">
                        <span className="text-xs text-gray-500">Press Enter to save, Escape to cancel</span>
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEditCategory}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal mode
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <div className="flex gap-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-500 border border-blue-100">
                          {items.filter(item => item.category_id === category.id).length} items
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCategory(category)
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(category.id, category.name)
                          }}
                          disabled={deletingCategoryId === category.id}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete category"
                        >
                          {deletingCategoryId === category.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Items Panel - 2/3 width */}
        <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-180px)] flex flex-col md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Items {selectedCategory && `- ${selectedCategory.name}`}
            </h2>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {selectedCategory 
                ? items.filter(item => item.category_id === selectedCategory.id).length
                : items.length
              } items
            </span>
          </div>
          
          {/* Add Item Form */}
          {selectedCategory && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Barcode (optional)"
                    value={newItemBarcode}
                    onChange={(e) => setNewItemBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a1 1 0 011-1h4a1 1 0 011 1v2M7 7h10" />
                  </svg>
                  <p className="mt-2 text-sm">Select a category to view items</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {items
                  .filter(item => item.category_id === selectedCategory.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.barcode && (
                            <div className="text-sm text-gray-500 mt-1">
                              Barcode: {item.barcode}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

     
    </div>
  )
}
