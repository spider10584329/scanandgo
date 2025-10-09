import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ 
      valid: true, 
      payload: {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
        customerId: payload.customerId
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 })
  }
}
