import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    // Extract and verify token
    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    try {
      // Try to find client record for this customer
      const client = await prisma.$queryRaw`
        SELECT clientname FROM clients WHERE customer_id = ${decoded.customerId} LIMIT 1
      `
      
      const clientArray = client as Array<{ clientname: string }>
      const clientName = clientArray.length > 0 ? clientArray[0].clientname : 'scanandgo'
      
      return NextResponse.json({ 
        clientname: clientName,
        success: true,
        customerId: decoded.customerId
      })
    } catch (dbError) {
      // If clients table doesn't exist or query fails, return default

      return NextResponse.json({ 
        clientname: 'scanandgo',
        success: true,
        customerId: decoded.customerId
      })
    }
  } catch (error) {
    console.error('Database error while fetching client name:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch client name',
        clientname: 'scanandgo',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    // Extract and verify token
    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    // Get request body
    const { clientname } = await request.json()
    
    if (!clientname || clientname.trim() === '') {
      return NextResponse.json(
        { error: 'Client name is required', success: false },
        { status: 400 }
      )
    }

    try {
      // First, check if a record already exists for this customer
      const existingClient = await prisma.$queryRaw`
        SELECT id FROM clients WHERE customer_id = ${decoded.customerId} LIMIT 1
      `
      
      const clientArray = existingClient as Array<{ id: number }>
      
      if (clientArray.length > 0) {
        // Update existing record
        await prisma.$queryRaw`
          UPDATE clients SET clientname = ${clientname.trim()} 
          WHERE customer_id = ${decoded.customerId}
        `
      } else {
        // Create new record
        await prisma.$queryRaw`
          INSERT INTO clients (customer_id, clientname) 
          VALUES (${decoded.customerId}, ${clientname.trim()})
        `
      }
      
      return NextResponse.json({ 
        clientname: clientname.trim(),
        success: true,
        message: 'Client name updated successfully'
      })
    } catch (dbError) {
      console.error('Database error while updating client name:', dbError)
      return NextResponse.json(
        { 
          error: 'Failed to update client name. Table may not exist.',
          success: false 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error while updating client name:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update client name',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
