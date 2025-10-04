import { ReactNode } from 'react'

interface ManagerLayoutProps {
  children: ReactNode
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
