import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/checkout(.*)',
  '/admin(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname

  // Never protect auth pages
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    // Strip runaway redirect_url param if present to avoid loops
    if (req.nextUrl.searchParams.has('redirect_url')) {
      const url = req.nextUrl.clone()
      url.searchParams.delete('redirect_url')
      return NextResponse.redirect(url)
    }
    return
  }

  // Allow APIs (including webhooks) to function without lock
  if (pathname.startsWith('/api')) {
    return
  }

  // Allow lock page itself
  if (pathname.startsWith('/lock')) {
    return
  }

  // Enforce site-wide lock unless unlock cookie is present
  const unlocked = req.cookies.get('hundoja_unlocked')
  if (!unlocked?.value) {
    const url = req.nextUrl.clone()
    url.pathname = '/lock'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Let admin routes handle their own authentication in the layout
  // This avoids middleware issues with async database calls
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}