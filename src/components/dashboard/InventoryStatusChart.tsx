'use client'

import { useEffect, useState } from 'react'

interface StatusData {
  status: number
  count: number
  label: string
  color: string
}

export default function InventoryStatusChart() {
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatusData()
  }, [])

  const fetchStatusData = async () => {
    try {
      const token = localStorage.getItem('auth-token') || 
                   document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      
      if (!token) return

      const response = await fetch('/api/inventories/status-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const statusMap = [
            { status: 0, label: 'Inactive', color: '#9CA3AF' },
            { status: 1, label: 'Active', color: '#10B981' },
            { status: 2, label: 'Maintenance', color: '#3B82F6' },
            { status: 3, label: 'Retired', color: '#F59E0B' },
            { status: 4, label: 'Missing', color: '#EF4444' }
          ]

          const formattedData = statusMap.map(statusInfo => {
            const count = data.statusCounts[statusInfo.status] || 0
            return {
              ...statusInfo,
              count
            }
          }).filter(item => item.count > 0)

          setStatusData(formattedData)
          setTotal(data.total)
        }
      }
    } catch (error) {
      console.error('Error fetching status data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (count: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const createPieSlice = (item: StatusData, index: number) => {
    const percentage = (item.count / total) * 100
    let cumulativePercentage = 0
    
    // Calculate cumulative percentage for this slice
    for (let i = 0; i < index; i++) {
      cumulativePercentage += (statusData[i].count / total) * 100
    }
    
    const startAngle = (cumulativePercentage * 360) / 100 - 90 // Start from top
    const endAngle = ((cumulativePercentage + percentage) * 360) / 100 - 90
    
    const radius = 90
    const centerX = 100
    const centerY = 100
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArc = percentage > 50 ? 1 : 0
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    // Calculate text position
    const textAngle = (startAngle + endAngle) / 2
    const textRadius = radius * 0.7
    const textAngleRad = (textAngle * Math.PI) / 180
    const textX = centerX + textRadius * Math.cos(textAngleRad)
    const textY = centerY + textRadius * Math.sin(textAngleRad)
    
    return (
      <g key={item.status}>
        <path
          d={pathData}
          fill={item.color}
          className="transition-all duration-300 hover:opacity-80"
        />
        {percentage > 5 && (
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-bold fill-white"
            style={{ fontSize: '12px' }}
          >
            {calculatePercentage(item.count)}%
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Chart Area */}
        <div className="relative mb-6">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {statusData.map((item, index) => createPieSlice(item, index))}
            {/* White center circle */}
            <circle
              cx="100"
              cy="100"
              r="45"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="text-xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Items Used</div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {statusData.map((item) => (
            <div key={item.status} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="text-xs text-gray-700">
                {calculatePercentage(item.count)}% {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
