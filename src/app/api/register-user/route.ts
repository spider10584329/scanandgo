import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, username, password, customerId } = await request.json()

    if (!adminEmail || !username || !password || !customerId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new user into operators table
    const newUser = await prisma.operators.create({
      data: {
        customer_id: customerId, // Use the admin user's ID as customer_id
        username: username,
        password: hashedPassword,
        isPasswordRequest: 0, // Set as not a password request by default
        isActive: 0, // Set as active by default
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: newUser.id
    })

  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
