import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateToken } from '@/lib/jwt'
import { z } from 'zod'
import axios from 'axios'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const signinSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'agent']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signinSchema.parse(body)

    console.log(`[Signin] Processing ${validatedData.role} login for:`, validatedData.email)

    // Handle Admin login (PulsePoint API authentication)
    if (validatedData.role === 'admin') {
      try {
        const apiUrl = process.env.PULSEPOINT_API_URL || 'https://api.pulsepoint.clinotag.com'
        
        // Authenticate with PulsePoint API
        console.log(`[Signin] Authenticating admin with PulsePoint API: ${apiUrl}`)
        const response = await axios.post(`${apiUrl}/api/user/project/signin`, {
          username: validatedData.email,
          password: validatedData.password,
          projectId: parseInt(process.env.PULSEPOINT_PROJECT_ID || '20')
        })

        console.log(`[Signin] PulsePoint response status:`, response.data.status)

        if (response.data.status === 1) {
          // Get user details from PulsePoint
          const userDetailsResponse = await axios.get(`${apiUrl}/api/user/allusers`, {
            auth: {
              username: 'admin',
              password: 'admin'
            }
          })

          const allUsers = userDetailsResponse.data?.data || userDetailsResponse.data || []
          const user = allUsers.find((u: { email?: string; id: number; status: number }) => 
            u.email?.toLowerCase() === validatedData.email.toLowerCase()
          )

          if (user) {
            console.log(`[Signin] Admin user found, generating token...`)
            
            // Generate JWT token with admin role and customer_id
            const token = await generateToken({
              customerId: user.id,
              userId: user.id,
              username: user.email || validatedData.email,
              email: user.email || validatedData.email,
              role: 'admin',
              isActive: true
            })

            // Return user data and token
            const adminResponse = NextResponse.json(
              {
                success: true,
                message: 'Login successful',
                token,
                user: {
                  customerId: user.id,
                  id: user.id,
                  username: user.email,
                  email: user.email,
                  role: 'admin'
                },
              },
              { status: 200 }
            )

            // Set cookies
            adminResponse.cookies.set('token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60, // 7 days
              path: '/',
            })

            adminResponse.cookies.set('auth-token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60, // 7 days
              path: '/',
            })

            adminResponse.cookies.set('userRole', 'admin', {
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60, // 7 days
              path: '/',
            })

            console.log(`[Signin] Admin login successful`)
            return adminResponse
          } else {
            console.log(`[Signin] Admin user not found in PulsePoint user list`)
            return NextResponse.json(
              { success: false, message: 'User account not found in system' },
              { status: 401 }
            )
          }
        } else if (response.data.status === -1) {
          console.log(`[Signin] Account not found`)
          return NextResponse.json(
            { success: false, message: 'Account not found' },
            { status: 401 }
          )
        } else if (response.data.status === 0) {
          console.log(`[Signin] Incorrect password`)
          return NextResponse.json(
            { success: false, message: 'Incorrect password' },
            { status: 401 }
          )
        }

        return NextResponse.json(
          { success: false, message: 'Login failed: Please check your subscription status' },
          { status: 401 }
        )
      } catch (apiError: unknown) {
        console.error('PulsePoint API error:', apiError)
        return NextResponse.json(
          { success: false, message: 'External authentication service unavailable' },
          { status: 503 }
        )
      } finally {
        await prisma.$disconnect()
      }
    }

    // Handle Agent login (Local database authentication)
    if (validatedData.role === 'agent') {
      try {
        // Find user in operators table by username
        console.log(`[Signin] Looking up agent with username:`, validatedData.email)
        const user = await prisma.operators.findFirst({
          where: { 
            username: validatedData.email 
          }
        })

        if (!user) {
          console.log(`[Signin] Agent not found for username: ${validatedData.email}`)
          return NextResponse.json(
            { success: false, message: 'This account is not registered.' },
            { status: 401 }
          )
        }

        console.log(`[Signin] Agent found:`, { 
          id: user.id, 
          username: user.username, 
          isActive: user.isActive,
          customer_id: user.customer_id,
          hasPassword: !!user.password
        })

        // Check if account is active
        if (!user.isActive || user.isActive === 0) {
          console.log(`[Signin] Agent account is not active: isActive=${user.isActive}`)
          return NextResponse.json(
            { success: false, message: 'Account is not active.' },
            { status: 403 }
          )
        }

        // Verify password using bcrypt
        console.log(`[Signin] Verifying agent password with bcrypt...`)
        const isValidPassword = await bcrypt.compare(
          validatedData.password,
          user.password
        )
        
        console.log(`[Signin] Password verification result:`, isValidPassword)

        if (!isValidPassword) {
          console.log(`[Signin] Incorrect password for agent`)
          return NextResponse.json(
            { success: false, message: 'Incorrect password.' },
            { status: 401 }
          )
        }

        // Generate JWT token with agent role and customer_id
        console.log(`[Signin] Agent authenticated, generating token...`)
        const token = await generateToken({
          customerId: user.customer_id,
          userId: user.id,
          username: user.username,
          role: 'agent',
          isActive: user.isActive === 1
        })

        // Return user data and token
        const agentResponse = NextResponse.json(
          {
            success: true,
            message: 'Login successful',
            token,
            user: {
              customerId: user.customer_id,
              id: user.id,
              username: user.username,
              role: 'agent'
            },
          },
          { status: 200 }
        )

        // Set cookies
        agentResponse.cookies.set('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        })

        agentResponse.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        })

        agentResponse.cookies.set('userRole', 'agent', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        })

        console.log(`[Signin] Agent login successful`)
        return agentResponse
      } finally {
        await prisma.$disconnect()
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid role specified' },
      { status: 400 }
    )

  } catch (error) {
    await prisma.$disconnect()
    
    if (error instanceof z.ZodError) {
      console.error('[Signin] Validation error:', error.issues)
      return NextResponse.json(
        { success: false, message: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Signin error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  }
}
