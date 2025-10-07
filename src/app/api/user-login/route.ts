import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user in operators table
    const user = await prisma.operators.findFirst({
      where: {
        username: username
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'This account is not registered.'
      })
    }

    // Check if account is active
    if (!user.isActive || user.isActive === 0) {
      return NextResponse.json({
        success: false,
        message: 'Account is not active.'
      })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
   
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        message: 'Incorrect password.'
      })
    }

    // Generate JWT token with agent role
    const token = await generateToken({
      customerId: user.customer_id,
      userId: user.id,
      username: user.username,
      role: 'agent',
      isActive: user.isActive === 1
    })

    // Login successful - both username and password are correct
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        customerId: user.customer_id,
        id: user.id,
        username: user.username,
        role: 'agent'
      }
    })

  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
