interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  color: 'blue' | 'pink' | 'yellow' | 'green' | 'purple' | 'indigo'
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
  loading?: boolean
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    hover: 'hover:bg-blue-100'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: 'text-pink-600',
    hover: 'hover:bg-pink-100'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    hover: 'hover:bg-yellow-100'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    hover: 'hover:bg-green-100'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    hover: 'hover:bg-purple-100'
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: 'text-indigo-600',
    hover: 'hover:bg-indigo-100'
  }
}

export function StatsCard({ title, value, subtitle, color, icon, trend, onClick, loading }: StatsCardProps) {
  const colors = colorClasses[color]
  
  if (loading) {
    return (
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
          <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`rounded-xl border-2 p-6 transition-all duration-200 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
        colors.bg
      } ${colors.border} ${onClick ? colors.hover : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
            {trend && (
              <div className={`flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <svg 
                  className={`w-3 h-3 mr-1 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          
          <div className="mb-2">
            <p className={`text-3xl font-bold ${colors.text} leading-none`}>
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colors.bg} ${colors.icon} ml-4`}>
            <div className="w-6 h-6">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatsGridProps {
  children: React.ReactNode
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {children}
    </div>
  )
}
