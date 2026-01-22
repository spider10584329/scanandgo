import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const apiUrl = process.env.PULSEPOINT_API_URL || 'https://api.pulsepoint.clinotag.com'
    const apiUsername = process.env.PULSEPOINT_API_USERNAME
    const apiPassword = process.env.PULSEPOINT_API_PASSWORD

    if (!apiUsername || !apiPassword) {
      console.error('[check-admin-email] PulsePoint API credentials not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const response = await axios.get(`${apiUrl}/api/user/allusers`, {
      auth: {
        username: apiUsername,
        password: apiPassword
      }
    })

    const allUsers = response.data?.data || response.data || []

    // Check if email exists in the user list and get their ID
    const adminUser = allUsers.find((user: { email?: string; id: number }) =>
      user.email?.toLowerCase() === email.toLowerCase()
    )

    if (!adminUser) {
      return NextResponse.json({
        exists: false,
        message: 'Administrator address does not exist.'
      })
    }

    return NextResponse.json({
      exists: true,
      customerId: adminUser.id
    })

  } catch (error) {
    console.error('[check-admin-email] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify admin email' },
      { status: 500 }
    )
  }
}
