import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
      const url = new URL(req.url)
      url.searchParams.delete('redirect_url')
      return Response.redirect(url)
    }
    return
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