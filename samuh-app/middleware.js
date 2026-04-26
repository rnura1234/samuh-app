// middleware.js
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // ✅ Only protect dashboard routes
  // Check for Supabase session cookie directly — zero network calls
  if (pathname.startsWith('/dashboard')) {
    const cookies = request.cookies.getAll()

    // Supabase stores session in this cookie
    const hasSession = cookies.some(
      c =>
        c.name.startsWith('sb-') &&
        c.name.endsWith('-auth-token')
    )

    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

// ✅ Very narrow matcher — only dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
}