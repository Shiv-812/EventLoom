import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/events/:id',
  '/sign-in',
  '/sign-up'
]);

const isPublicApiRoute = createRouteMatcher([
  '/api/webhook/clerk',
  '/api/webhook/stripe',
  '/api/uploadthing'
]);

export default clerkMiddleware((auth, req) => {
  const { userId, redirectToSignIn } = auth();
  const currentUrl = new URL(req.url);
  // const isAccessingHome = currentUrl.pathname === '/';
  const isApiRequest = currentUrl.pathname.startsWith('/api');

  //  Allow logged-in users to access public routes without forced redirect
  if (userId && isPublicRoute(req)) {
    return NextResponse.next();
  }

  //  Prevent unauthorized users from accessing protected pages
  if (!userId) {
    if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    //  Instead of redirecting API requests, return a 401 Unauthorized response
    if (isApiRequest && !isPublicApiRoute(req)) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
