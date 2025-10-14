import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// Array of 30 valid API keys (UUIDs) - kept secure on backend only
const VALID_API_KEYS = [
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
  'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
  'd4e5f6g7-h8i9-0123-4567-890123defghi',
  'e5f6g7h8-i9j0-1234-5678-901234efghij',
  'f6g7h8i9-j0k1-2345-6789-012345fghijk',
  'g7h8i9j0-k1l2-3456-7890-123456ghijkl',
  'h8i9j0k1-l2m3-4567-8901-234567hijklm',
  'i9j0k1l2-m3n4-5678-9012-345678ijklmn',
  'j0k1l2m3-n4o5-6789-0123-456789jklmno',
  'k1l2m3n4-o5p6-7890-1234-567890klmnop',
  'l2m3n4o5-p6q7-8901-2345-678901lmnopq',
  'm3n4o5p6-q7r8-9012-3456-789012mnopqr',
  'n4o5p6q7-r8s9-0123-4567-890123nopqrs',
  'o5p6q7r8-s9t0-1234-5678-901234opqrst',
  'p6q7r8s9-t0u1-2345-6789-012345pqrstu',
  'q7r8s9t0-u1v2-3456-7890-123456qrstuv',
  'r8s9t0u1-v2w3-4567-8901-234567rstuvw',
  's9t0u1v2-w3x4-5678-9012-345678stuvwx',
  't0u1v2w3-x4y5-6789-0123-456789tuvwxy',
  'u1v2w3x4-y5z6-7890-1234-567890uvwxyz',
  'v2w3x4y5-z6a7-8901-2345-678901vwxyza',
  'w3x4y5z6-a7b8-9012-3456-789012wxyzab',
  'x4y5z6a7-b8c9-0123-4567-890123xyzabc',
  'y5z6a7b8-c9d0-1234-5678-901234yzabcd',
  'z6a7b8c9-d0e1-2345-6789-012345zabcde',
  'a7b8c9d0-e1f2-3456-7890-123456abcdef',
  'b8c9d0e1-f2g3-4567-8901-234567bcdefg',
  'c9d0e1f2-g3h4-5678-9012-345678cdefgh',
  'd0e1f2g3-h4i5-6789-0123-456789defghi'
]

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

    // Verify token and check if user is admin
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Generate random API key
    const randomIndex = Math.floor(Math.random() * VALID_API_KEYS.length)
    const selectedKey = VALID_API_KEYS[randomIndex]

    return NextResponse.json({
      success: true,
      apiKey: selectedKey
    })

  } catch (error) {
    console.error('Generate API key error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
