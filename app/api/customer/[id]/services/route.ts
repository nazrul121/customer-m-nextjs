import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CustomerServiceSchema } from '@/lib/schemas';
import { string } from 'better-auth';

// 1. Update the type to Promise<{ id: string }>
// /api/customer/[id]/services/route.ts
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
  
        const sortId = searchParams.get('sortId') || 'createdAt';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const skip = (page - 1) * pageSize;

        // 🔑 FIX: Dynamic Sorting for nested relations
        let orderBy: any = {};
        if (sortId === 'service') {
            orderBy = { service: { name: sortDir } };
        } else {
            orderBy = { [sortId]: sortDir };
        }

        const [customerServices, totalCount] = await prisma.$transaction([
            prisma.customerService.findMany({
                where: { customerId: id },
                skip,
                take: pageSize,
                include: {
                    service: {
                        include: {
                            serviceType: true
                        }
                    }
                },
                orderBy: orderBy // 👈 Use the fixed orderBy
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

// --- POST (Create) ---
export async function POST(request: Request) {
    try {
        // 1. Parse JSON body (matching your frontend fetch call)
        const body = await request.json();

        // 2. Validate with Zod
        const validation = CustomerServiceSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Validation failed', 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }

        const data = validation.data;

        // 3. 🛡️ Check for duplicates (The 409 Conflict logic)
        const existingSubscription = await prisma.customerService.findFirst({
            where: {
                customerId: data.customerId,
                serviceId: data.serviceId,
            }
        });

        if (existingSubscription) {
            return NextResponse.json({ 
                message: 'This customer is already subscribed to this service.' 
            }, { status: 409 });
        }

        // 4. Create the new record
        const newCustomerService = await prisma.customerService.create({
            data: {
                customerId: data.customerId,
                serviceId: data.serviceId,
                initCost: data.initCost,
                mmc: data.mmc,
                initCostDis: data.initCostDis,
                mmcDis: data.mmcDis,
                startDate: data.startDate,
                expiryDate: data.expiryDate,
                isRepeat: data.isRepeat,
            }
        });

        return NextResponse.json({
            message: 'Subscription created successfully',
            data: newCustomerService
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST Error:', error);
        return NextResponse.json({ 
            message: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}

// --- PUT (Update) ---
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...formData } = body;

        if (!id) {
            return NextResponse.json({ message: 'Subscription ID is required' }, { status: 400 });
        }

        // 1. Validate the incoming data with Zod
        const validation = CustomerServiceSchema.safeParse(formData);
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Validation failed', 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }

        const data = validation.data;

        // 2. Verify the record exists
        const existingRecord = await prisma.customerService.findUnique({
            where: { id }
        });

        if (!existingRecord) {
            return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
        }

        // 3. 🛡️ Conflict Check: If serviceId or customerId changed, 
        // check if that new combination already exists elsewhere
        if (data.serviceId !== existingRecord.serviceId || data.customerId !== existingRecord.customerId) {
            const conflict = await prisma.customerService.findFirst({
                where: {
                    customerId: data.customerId,
                    serviceId: data.serviceId,
                    id: { not: id } // Ensure we aren't comparing the record to itself
                }
            });

            if (conflict) {
                return NextResponse.json({ 
                    message: 'This customer is already subscribed to the new service selected.' 
                }, { status: 409 });
            }
        }

        // 4. Perform the Update
        const updatedCustomerService = await prisma.customerService.update({
            where: { id },
            data: {
                customerId: data.customerId,
                serviceId: data.serviceId,
                initCost: data.initCost,
                mmc: data.mmc,
                initCostDis: data.initCostDis,
                mmcDis: data.mmcDis,
                startDate: data.startDate,
                expiryDate: data.expiryDate,
                isRepeat: data.isRepeat,
            }
        });

        return NextResponse.json({
            message: 'Subscription updated successfully',
            data: updatedCustomerService
        }, { status: 200 });

    } catch (error: any) {
        console.error('PUT Error:', error);
        return NextResponse.json({ 
            message: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}

// --- DELETE ---
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const customer = await prisma.customer.findUnique({ where: { id } });

        if (customer) {
            await prisma.customer.delete({ where: { id } });
        }

        return NextResponse.json({ message: 'Customer and files deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
    }
}

