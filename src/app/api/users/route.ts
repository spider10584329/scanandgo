import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Proxy API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from external API',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
