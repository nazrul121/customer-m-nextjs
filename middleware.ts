import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 🔑 Fix: Call the Better-Auth session API endpoint directly via fetch
    // This avoids loading the heavy Prisma client into the Edge Middleware
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: {
            cookie: request.headers.get("cookie") || "",
        },
    });

    const session = await sessionResponse.json();

    // 1. If no session and trying to access dashboard
    if (!session && pathname.startsWith('/dashboard')) {
        if (pathname === '/dashboard/unauthorized') return NextResponse.next();
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (session) {
        const role = session.user?.role?.toLowerCase();

        // Redirect logged-in users away from login page
        if (pathname === '/auth/login') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // 🛡️ Role Guard
        const isAccessingAdmin = pathname.startsWith('/dashboard/admin');
        const isAccessingCustomer = pathname.startsWith('/dashboard/customer');
        const isAccessingUser = pathname.startsWith('/dashboard/user');

        if ((isAccessingAdmin && role !== 'admin') || 
            (isAccessingCustomer && role !== 'customer') || 
            (isAccessingUser && role !== 'user')) {
            return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/auth/login', '/dashboard/:path*']
};