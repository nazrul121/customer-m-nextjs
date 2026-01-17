import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    // 🛡️ Security: Ensure only admins can call this
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [servicesCount, usersCount] = await Promise.all([
            prisma.service.count(),
            prisma.customer.count(),
        ]);

        return NextResponse.json({
            activeServices: servicesCount,
            totalUsers: usersCount,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}