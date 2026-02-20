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
  categories?: {
    id: number
    name: string
  } | null
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemBarcode, setNewItemBarcode] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editingItemName, setEditingItemName] = useState('')
  const [editingItemBarcode, setEditingItemBarcode] = useState('')

  // Fetch categories and items on component mount
  useEffect(() => {
    fetchCategories()
    fetchItems()
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

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) {
        toastError('No authentication token found')
        return
      }

      const response = await fetch('/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setItems(data.items)
      } else {
        toastError(data.error || 'Failed to fetch items')
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      toastError('Failed to load items')
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
        
        // Update items list to reflect the new category name
        setItems(prev => prev.map(item => 
          item.category_id === editingCategoryId && item.categories
            ? { ...item, categories: { ...item.categories, name: data.category.name } }
            : item
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

  const handleAddItem = async () => {
    if (!selectedCategory) {
      toastError('Please select a category first')
      return
    }

    if (!newItemName.trim()) {
      toastError('Please enter an item name')
      return
    }

    if (!newItemBarcode.trim()) {
      toastError('Please enter a barcode - it is required')
      return
    }

    setIsAddingItem(true)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
     
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          barcode: newItemBarcode.trim(),
          category_id: selectedCategory.id
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Add new item to the list
        setItems(prev => [...prev, data.item])
        setNewItemName('')
        setNewItemBarcode('')
        toastSuccess(`Item "${data.item.name}" added successfully!`)
      } else {
        // Handle specific error messages, especially duplicate barcodes     
        if (response.status === 409) {     
          toastError(`Barcode "${newItemBarcode.trim()}" already exists! Please use a unique barcode.`)
        } else {
           toastError(data.error || 'Failed to add item')
        }
      }
    } catch {      
      toastError('Failed to add item')
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete the item "${itemName}"? This action cannot be undone.`)) {
      return
    }
    setDeletingItemId(itemId)
    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: itemId
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Remove item from the list
        setItems(prev => prev.filter(item => item.id !== itemId))
        toastSuccess(`Item "${itemName}" deleted successfully!`)
      } else {
        toastError(data.error || 'Failed to delete item')
      }
    } catch {    
      toastError('Failed to delete item')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id)
    setEditingItemName(item.name)
    setEditingItemBarcode(item.barcode || '')
  }

  const handleSaveEditItem = async () => {
    if (!editingItemName.trim()) {
      toastError('Please enter an item name')
      return
    }

    if (!editingItemBarcode.trim()) {
      toastError('Please enter a barcode - it is required')
      return
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        
      const response = await fetch('/api/items', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingItemId,
          name: editingItemName.trim(),
          barcode: editingItemBarcode.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Update item in the list
        setItems(prev => prev.map(item => 
          item.id === editingItemId 
            ? { ...item, name: data.item.name, barcode: data.item.barcode }
            : item
        ))
        
        // Reset edit state
        setEditingItemId(null)
        setEditingItemName('')
        setEditingItemBarcode('')
        
        toastSuccess(`Item updated successfully!`)
      } else {
        // Handle specific error messages, especially duplicate barcodes
        if (response.status === 409) {
          toastError(`Barcode "${editingItemBarcode.trim()}" already exists! Please use a unique barcode.`)
        } else {
          toastError(data.error || 'Failed to update item')
        }
      }
    } catch {    
      toastError('Failed to update item')
    }
  }

  const handleCancelEditItem = () => {
    setEditingItemId(null)
    setEditingItemName('')
    setEditingItemBarcode('')
  }

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-lg sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-6">Category Management</h1>
      
      {/* Responsive layout - stack below 768px, side-by-side above */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-6 min-h-0">
        
        {/* Categories Panel - Full width on mobile, fixed width on desktop */}
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 flex flex-col md:flex-shrink-0 h-80 md:h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between mb-4 lg:mb-4">
            <h2 
              className="text-md sm:text-lg lg:text-lg font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => setSelectedCategory(null)}
              title="Click to clear selection"
            >
              Categories
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded">
              total : {categories.length}
            </span>
          </div>
          
          {/* Add Category Form */}
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
              <input
                id="category-name"
                type="text"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-400 rounded-md bg-[#ffffff] focus:outline-none"
              />
              <button 
                onClick={handleAddCategory}
                disabled={isAdding}
                className="w-full sm:w-auto sm:flex-shrink-0 px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed whitespace-nowrap"
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
                  className={`p-2 sm:p-2 border rounded-lg transition-colors ${
                    editingCategoryId === category.id
                      ? 'bg-blue-50 border-blue-300'
                      : selectedCategory?.id === category.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => editingCategoryId !== category.id && setSelectedCategory(category)}
                >
                  {editingCategoryId === category.id ? (
                    // Edit mode - professional inline editing
                    <div className="space-y-2 sm:space-y-3">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-400 rounded-md focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditCategory()
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                      />
                      <div className="flex gap-1 sm:gap-2 justify-between items-center">
                        <span className="text-xs text-gray-500 hidden sm:block">Press Enter to save, Escape to cancel</span>
                        <div className="flex gap-0.5 sm:gap-1 ml-auto sm:ml-0">
                          <button
                            onClick={handleSaveEditCategory}
                            className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 sm:px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Normal mode
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-xs sm:text-sm lg:text-sm truncate mr-2">{category.name}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-700">
                          {items.filter(item => item.category_id === category.id).length}
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
        
        {/* Items Panel - Full width on mobile, flexible on desktop */}
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 flex-1 min-w-0 flex flex-col h-80 md:h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between mb-4 lg:mb-4">
            <h2 className="text-md sm:text-lg lg:text-lg font-semibold text-gray-800 truncate mr-2">
              Items {selectedCategory && `- ${selectedCategory.name}`}
            </h2>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded flex-shrink-0">
              {selectedCategory 
                ? items.filter(item => item.category_id === selectedCategory.id).length
                : items.length
              } items
            </span>
          </div>
          
          {/* Add Item Form */}
          {selectedCategory && (
            <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex flex-col lg:flex-row gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-[#ffffff] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Barcode (required)"
                    value={newItemBarcode}
                    onChange={(e) => setNewItemBarcode(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-[#ffffff] focus:outline-none"
                    required
                  />
                  <button 
                    onClick={handleAddItem}
                    disabled={isAddingItem}
                    className="w-full lg:w-auto lg:flex-shrink-0 px-4 sm:px-6 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isAddingItem ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            {(selectedCategory 
              ? items.filter(item => item.category_id === selectedCategory.id)
              : items
            ).length === 0 ? (
              <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6a2 2 0 00-2 2v3a2 2 0 002 2h6m-16 0h6a2 2 0 002-2v-3a2 2 0 00-2-2H4z" />
                  </svg>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm">
                    {selectedCategory ? 'No items in this category' : 'No items found'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Table View - Always visible, responsive sizing with horizontal scroll */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200" style={{minWidth: '480px'}}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tight sm:tracking-wider w-1/4">
                          Category
                        </th>
                        <th className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tight sm:tracking-wider w-1/3">
                          Item Name
                        </th>
                        <th className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tight sm:tracking-wider w-1/4">
                          Barcode
                        </th>
                        <th className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-tight sm:tracking-wider w-auto">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedCategory 
                      ? items.filter(item => item.category_id === selectedCategory.id)
                      : items
                    ).map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          editingItemId === item.id ? 'bg-gray-50' : 'bg-white' 
                        }`}
                      >
                        {editingItemId === item.id ? (
                          // Edit mode - inline editing in table
                          <>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-blue-600 font-medium">
                              <span className="truncate block max-w-24 sm:max-w-32">
                                {item.categories?.name || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm">
                              <input
                                type="text"
                                value={editingItemName}
                                onChange={(e) => setEditingItemName(e.target.value)}
                                className="w-full px-1 py-0.5 sm:px-1.5 sm:py-1 text-xs sm:text-sm border border-gray-400 rounded focus:outline-none min-w-0"
                                autoFocus
                              />
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm">
                              <input
                                type="text"
                                value={editingItemBarcode}
                                onChange={(e) => setEditingItemBarcode(e.target.value)}
                                placeholder="Barcode"
                                className="w-full px-1 py-0.5 sm:px-1.5 sm:py-1 text-xs sm:text-sm border border-gray-400 rounded focus:outline-none min-w-0"
                                required
                              />
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-right text-xs sm:text-sm">
                              <div className="flex gap-0.5 sm:gap-1 justify-end">
                                <button
                                  onClick={handleSaveEditItem}
                                  className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  title="Save changes"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditItem}
                                  className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                  title="Cancel editing"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // Normal mode - display data
                          <>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-blue-600 font-medium">
                              <span className="inline-flex items-center px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-500 border border-blue-100 max-w-24 sm:max-w-32 truncate">
                                {item.categories?.name || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                              <span className="truncate block max-w-32 sm:max-w-40 md:max-w-48">
                                {item.name}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                              <span className="truncate block max-w-20 sm:max-w-24 md:max-w-32 font-mono">
                                {item.barcode}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 whitespace-nowrap text-right text-xs sm:text-sm">
                              <div className="flex gap-0.5 justify-end">
                                <button 
                                  onClick={() => handleEditItem(item)}
                                  className="p-0.5 sm:p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit item"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  disabled={deletingItemId === item.id}
                                  className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Delete item"
                                >
                                  {deletingItemId === item.id ? (
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                                  ) : (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
