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

    // Find user in operators table
    const user = await prisma.operators.findFirst({
      where: {
        username: username
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'This account is not registered.',
        code: 'USER_NOT_FOUND'
      })
    }

    // Update isPasswordRequest field to 1 (password reset requested)
    await prisma.operators.update({
      where: {
        id: user.id
      },
      data: {
        isPasswordRequest: 1
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset request submitted successfully. Please contact your administrator.',
    })

  } catch (error: unknown) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
