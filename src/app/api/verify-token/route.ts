import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required', valid: false }, { status: 400 })
    }

    const payload = await verifyToken(token)
    
    if (!payload) {
      console.error('[Verify Token] Invalid token - verification failed')
      return NextResponse.json({ error: 'Invalid token', valid: false }, { status: 401 })
    }

    console.log('[Verify Token] Token verified successfully:', {
      userId: payload.userId,
      role: payload.role,
      customerId: payload.customerId,
      isActive: payload.isActive
    })

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
    return NextResponse.json({ error: 'Token verification failed', valid: false }, { status: 500 })
  }
}