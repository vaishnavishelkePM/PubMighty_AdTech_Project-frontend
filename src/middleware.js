import { NextResponse } from 'next/server';

import { CONFIG } from './global-config';

// API call to check session validity
async function verifySessionToken(token) {
  try {
    const res = await fetch(`${CONFIG.apiUrl}/v1/admin/check-session-valid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body if needed
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Session validation failed:', errorData);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Session validation failed:', error.message);
    return null;
  }
}

export async function middleware(req) {
  console.log('Middleware running on:', req.nextUrl.pathname);

  const { pathname } = req.nextUrl;

  // Create response and set cookie
  const response = NextResponse.next();
  // Apply only to /dashboard and its subroutes
  if (pathname.startsWith('/dashboard')) {
    // Get sessionToken from client-side cookies
    const sessionToken = req.cookies.get('session_key')?.value;
    console.log(sessionToken);
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verify sessionToken with backend
    const data = await verifySessionToken(sessionToken);

    if (!data || !data.success) {
      return NextResponse.redirect(new URL('/logout', req.url));
    }

    return response;
  }
  console.warn('Runimg 2');

  return response;
}

export const config = {
  matcher: [
    // Match all routes except:
    // - _next static files
    // - API routes
    // - static files with extensions
    '/((?!_next|api|.*\\..*).*)',
  ],
};
