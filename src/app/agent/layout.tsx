import { ReactNode } from 'react'

interface AgentLayoutProps {
  children: ReactNode
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
