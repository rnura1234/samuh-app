// app/api/switch-samuh/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  const { samuhId } = await request.json()
  const cookieStore = await cookies()

  cookieStore.set('active_samuh_id', samuhId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return NextResponse.json({ success: true })
}