import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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

    // 2. If session exists
    if (session) {
        const role = session.user?.role?.toLowerCase();

        // 🔑 FIXED: Redirect logged-in users away from ALL auth pages (login & register)
        if (pathname === '/auth/login') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // 🛡️ Role Guard
        const isAccessingAdmin = pathname.startsWith('/dashboard/admin');
        const isAccessingCustomer = pathname.startsWith('/dashboard/customer');
        const isAccessingUser = pathname.startsWith('/dashboard/user');

        if ((isAccessingAdmin && role !== 'admin') || (isAccessingCustomer && role !== 'customer') || (isAccessingUser && role !== 'user')) {
            return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
        }
    }

    return NextResponse.next();
}

// 🔑 FIXED: Added /auth/register to the matcher
export const config = {
    matcher: ['/auth/login', '/auth/register', '/dashboard/:path*']
};