import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const response = await axios.get('https://puksepoint.myrfid.nc/user/allusers', {
      auth: {
        username: 'admin',
        password: 'admin'
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error('Proxy API Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from external API',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}
