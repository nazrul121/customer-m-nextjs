import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. Update the type to Promise<{ id: string }>
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } 
) {
    try {
        // 2. Await the params to get the ID
        const { id } = await params;

        const { searchParams } = new URL(request.url);
        
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const skip = (page - 1) * pageSize;

        const [customerServices, totalCount] = await prisma.$transaction([
            prisma.customerService.findMany({
                where: { customerId: id },
                skip,
                take: pageSize,
                include: {
                    service: {
                        select: {
                            name: true,
                            serviceType: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.customerService.count({ where: { customerId: id } }),
        ]);

        return NextResponse.json({
            data: customerServices,
            meta: { totalCount, pageSize, currentPage: page }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Failed to fetch services' }, { status: 500 });
    }
}