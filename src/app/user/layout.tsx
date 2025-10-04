import { ReactNode } from 'react'

interface UserLayoutProps {
  children: ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
