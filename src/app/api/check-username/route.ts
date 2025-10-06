import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username exists in operators table
    const existingUser = await prisma.operators.findFirst({
      where: {
        username: username
      }
    })

    return NextResponse.json({
      exists: !!existingUser,
      message: existingUser ? 'Username already exists' : 'Username is available'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
