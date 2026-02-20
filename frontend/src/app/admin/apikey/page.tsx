'use client'
import { useState, useEffect } from 'react'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'



export default function AdminDashboard() {
  const { user } = useAuth('admin')
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [completeUrl, setCompleteUrl] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Set default customer ID from authenticated user and fetch existing API key
  useEffect(() => {
    const fetchExistingApiKey = async () => {
      try {
        // Get auth token
        const token = localStorage.getItem('auth-token') || document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]

        if (!token) {
          return
        }

        const response = await fetch('/api/admin/get-apikey', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.exists && data.apiKey) {
            setCurrentApiKey(data.apiKey)
          
            // Generate the complete API URL with existing key
            const baseUrl = window.location.origin
            const apiUrl = `${baseUrl}/api/scanandgo/inventory?customer_id=${user?.customerId}&apikey=${data.apiKey}`
            setCompleteUrl(apiUrl)
          }
        }
      } catch (error) {
        console.error('Error fetching existing API key:', error)
      }
    }

    if (user?.customerId) {
      setCustomerId(user.customerId.toString())
      fetchExistingApiKey()
    }
  }, [user])

  const generateRandomApiKey = async () => {
    if (!customerId) {
      toastError('Please enter a customer ID')
      return
    }

    setIsGenerating(true)
    try {
      // Get auth token
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        toastError('Authentication token not found')
        return
      }

      const response = await fetch('/api/admin/generate-apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.apiKey) {
        setCurrentApiKey(data.apiKey)
        
        // Generate the complete API URL
        const baseUrl = window.location.origin
        const apiUrl = `${baseUrl}/api/scanandgo/inventory?customer_id=${customerId}&apikey=${data.apiKey}`
        setCompleteUrl(apiUrl)
        
        toastSuccess('API key generated successfully!')
      } else {
        toastError(data.message || 'Failed to generate API key')
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      toastError('Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'apikey' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      toastSuccess('Copied to clipboard!')
      
      // Show success icon temporarily
      if (type === 'apikey') {
        setCopiedApiKey(true)
        setTimeout(() => setCopiedApiKey(false), 2000)
      } else {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadCSV = async () => {
    if (!customerId) {
      toastError('Please enter a customer ID')
      return
    }

    setIsDownloading(true)
    try {
      // Get auth token
      const token = localStorage.getItem('auth-token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (!token) {
        toastError('Authentication token not found')
        return
      }

      // Generate a temporary API key for this download
      const keyResponse = await fetch('/api/admin/generate-apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      if (!keyResponse.ok) {
        throw new Error(`HTTP error! status: ${keyResponse.status}`)
      }

      const keyData = await keyResponse.json()

      if (!keyData.success || !keyData.apiKey) {
        toastError('Failed to generate temporary API key')
        return
      }

      // Fetch data using the temporary API key
      const baseUrl = window.location.origin
      const apiUrl = `${baseUrl}/api/scanandgo/inventory?customer_id=${customerId}&apikey=${keyData.apiKey}`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        toastError('No data available to export')
        return
      }

      // Convert JSON to CSV
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes in values
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `inventory_customer_${customerId}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toastSuccess('CSV file downloaded successfully!')
      
    } catch (error) {
      console.error('Error downloading CSV:', error)
      toastError('Failed to download CSV file')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">API Key</h1>
      
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-210px)]">
        <div className="flex-1 bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold mb-2">Generate API Key</h2>
          <p className="text-sm text-gray-600 mb-4">Create a new API key for accessing the inventory system.</p>
          
          <div className="space-y-4">
            {/* Customer ID Display (Read-only) */}
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <input
                id="customerId"
                type="text"
                value={customerId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none text-gray-600"
                placeholder="Customer ID from your account"
              />
            </div>

            {/* API Key Display */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Generated API Key
              </label>
              <div className="flex gap-2">
                <input
                  id="apiKey"
                  type="text"
                  value={currentApiKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none text-sm text-gray-600 min-w-0"
                  placeholder="Click Generate Key to create an API key"
                />
                {currentApiKey && (
                  <button
                    onClick={() => copyToClipboard(currentApiKey, 'apikey')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-fit"
                  >
                    <Image
                      src={copiedApiKey ? "/copy-check.svg" : "/copy.svg"}
                      alt="Copy"
                      width={20}
                      height={20}
                      className="w-6 h-6 brightness-0 invert"
                    />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                )}
              </div>
            </div>

            {/* Complete URL Display */}
            <div className='mb-6'>
              <label htmlFor="completeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Complete API URL
              </label>
              <div className="flex gap-2">
                <input
                  id="completeUrl"
                  type="text"
                  value={completeUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none text-sm text-gray-600 min-w-0"
                  placeholder="Complete URL will appear here"
                />
                {completeUrl && (
                  <button
                    onClick={() => copyToClipboard(completeUrl, 'url')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-fit"
                  >
                    <Image
                      src={copiedUrl ? "/copy-check.svg" : "/copy.svg"}
                      alt="Copy"
                      width={20}
                      height={20}
                      className="w-6 h-6 brightness-0 invert"
                    />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button 
                onClick={generateRandomApiKey}
                disabled={isGenerating}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors font-medium shadow-sm hover:shadow-md ${
                  isGenerating 
                    ? 'bg-blue-600 cursor-not-allowed text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Image
                    src="/key.svg"
                    alt="Generate"
                    width={20}
                    height={20}
                    className="w-5 h-5 brightness-0 invert"
                  />
                <span>{isGenerating ? 'Generating...' : 'Generate Key'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold mb-2">Export to external file</h2>
          <p className="text-sm text-gray-600 mb-4">Download inventory data in various formats for external use.</p>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3 sm:p-4">
              <h3 className="font-medium text-green-800 mb-2 text-sm sm:text-base">Export to CSV file</h3>
              <p className="text-sm text-green-700 mb-4 sm:mb-6 leading-relaxed">
                CSV files are plaintext data files separated by commas, so they can be opened directly as Excel sheets and are a very useful file format for exporting and importing data from other programs.
              </p>
              
              <div className="flex justify-end ">
                <button
                  onClick={downloadCSV}
                  disabled={isDownloading}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors font-medium shadow-sm hover:shadow-md ${
                    isDownloading 
                      ? 'bg-green-700 cursor-not-allowed text-white' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Image
                    src="/download.svg"
                    alt="Download"
                    width={20}
                    height={20}
                    className="w-5 h-5 brightness-0 invert"
                  />
                  <span>{isDownloading ? 'Downloading...' : 'Download CSV'}</span>
                </button>
              </div>
              

            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-md p-3">
              <h4 className="font-medium text-pink-800 mb-1 text-sm">File Information</h4>
              <ul className="text-xs text-pink-700 bg-pink-100 p-2 rounded space-y-1">
                <li className="break-words">• Filename: inventory_customer_{customerId || 'ID'}_{new Date().toISOString().split('T')[0]}.csv</li>
                <li className="break-words">• Format: UTF-8 encoded CSV</li>
                <li className="break-words">• Compatible with Excel, Google Sheets, and other spreadsheet applications</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <h4 className="font-medium text-yellow-800 mb-1 text-sm">CSV Structure</h4>
              <p className="text-sm text-yellow-700 mb-2">
                The CSV file will contain all inventory fields with resolved names:
              </p>
              <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded overflow-x-auto">
                <code className="block whitespace-nowrap sm:whitespace-normal sm:break-words">id,customer_id,category_name,item_name,building_name,area_name,floor_name,detail_location_name,purchase_date,...</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
