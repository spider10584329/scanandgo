import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 401 }
      )
    }

    // Verify token and check if user is admin or agent
    const payload = await verifyToken(token)
    if (!payload || (payload.role !== 'admin' && payload.role !== 'agent')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin or Agent access required' },
        { status: 403 }
      )
    }

    // Use customer_id from the verified token (ignore any request body)
    const customerId = payload.customerId

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID not found in token' },
        { status: 400 }
      )
    }

    // Check how many API keys exist for this customer_id using raw SQL
    let apiKey: string

    try {
      const countResult = await prisma.$queryRaw<Array<{count: number}>>`
        SELECT COUNT(*) as count FROM apikey WHERE customer_id = ${customerId}
      `
      
      const existingKeysCount = countResult[0].count

      if (existingKeysCount >= 30) {
        // If 30 or more keys exist, return a random existing key
        const existingKeys = await prisma.$queryRaw<Array<{api_key: string}>>`
          SELECT api_key FROM apikey WHERE customer_id = ${customerId}
        `

        const randomIndex = Math.floor(Math.random() * existingKeys.length)
        apiKey = existingKeys[randomIndex].api_key
      } else {
        // If fewer than 30 keys exist, generate a new UUID and insert it
        apiKey = uuidv4()

        try {
          await prisma.$executeRaw`
            INSERT INTO apikey (customer_id, api_key, created_at) 
            VALUES (${customerId}, ${apiKey}, NOW())
          `
        } catch (insertError) {
          console.error('Error creating new API key:', insertError)
          return NextResponse.json(
            { success: false, message: 'Failed to create new API key' },
            { status: 500 }
          )
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database operation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey: apiKey
    })

  } catch (error) {
    console.error('Generate API key error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
