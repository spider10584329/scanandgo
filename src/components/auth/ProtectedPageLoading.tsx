interface ProtectedPageLoadingProps {
  color?: string
  message?: string
}

export function ProtectedPageLoading({ 
  color = 'border-blue-600', 
  message = 'Verifying permissions...' 
}: ProtectedPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${color} mx-auto`}></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}
