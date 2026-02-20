import { useState } from 'react'

interface TableColumn {
  key: string
  label: string
  className?: string
  sortable?: boolean
  width?: string
}

interface TableRow {
  [key: string]: React.ReactNode
  id?: string | number
}

interface DataTableProps {
  title: string
  columns: TableColumn[]
  data: TableRow[]
  actionButton?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  searchable?: boolean
  exportable?: boolean
  loading?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (row: TableRow) => void
  emptyState?: {
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

export default function DataTable({ 
  title, 
  columns, 
  data, 
  actionButton, 
  searchable = false,
  exportable = false,
  loading = false,
  pagination,
  onRowClick,
  emptyState
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter(row =>
        columns.some(column =>
          String(row[column.key]).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = String(a[sortColumn])
        const bValue = String(b[sortColumn])
        const comparison = aValue.localeCompare(bValue, 'fr-FR', { numeric: true })
        return sortDirection === 'asc' ? comparison : -comparison
      })
    : filteredData

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleExport = () => {
    // Simple CSV export
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...sortedData.map(row =>
        columns.map(col => `"${String(row[col.key])}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-300 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 mb-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-gray-300 rounded flex-1 animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {sortedData.length} item{sortedData.length !== 1 ? 's' : ''}
              {searchQuery && ` trouvé${sortedData.length !== 1 ? 's' : ''} pour "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {exportable && (
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            )}
            
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  actionButton.variant === 'secondary'
                    ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {actionButton.label}
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {searchable && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search in table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {sortedData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${column.className || ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <svg 
                            className={`w-3 h-3 ${
                              sortColumn === column.key && sortDirection === 'asc' 
                                ? 'text-blue-600' 
                                : 'text-gray-400'
                            }`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, index) => (
                <tr 
                  key={row.id || index} 
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || 'text-gray-900'}`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle view action
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more actions
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || 'No data available'}
          </h3>
          <p className="text-gray-500 mb-4">
            {emptyState?.description || 'There is currently no data to display in this table.'}
          </p>
          {emptyState?.action && (
            <button
              onClick={emptyState.action.onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
              >
                Précédent
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  status: 'compliant' | 'missing' | 'excess'
  children: React.ReactNode
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusClasses = {
    compliant: 'bg-green-100 text-green-800 border border-green-200',
    missing: 'bg-red-100 text-red-800 border border-red-200',
    excess: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
      {children}
    </span>
  )
}
