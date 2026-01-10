import { NextResponse } from 'next/server';
import { CustomerSchema } from '@/lib/schemas';
import prisma from '@/lib/prisma';

import { saveFile, deleteOldFile } from '@/lib/file-storage';
// --- GET (Read All) ---
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const skip = (page - 1) * pageSize;
        const searchTerm = searchParams.get('search') || '';
        
        const whereClause: any = {};
        if (searchTerm) {
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }

        const sortId = searchParams.get('sortId') || 'createdAt';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const [customers, totalCount] = await prisma.$transaction([
            prisma.customer.findMany({
                where: whereClause,
                skip,
                take: pageSize,
                orderBy: { [sortId]: sortDir },
            }),
            prisma.customer.count({ where: whereClause }), // Fixed: was prisma.user.count
        ]);
        
        return NextResponse.json({ 
            data: customers, 
            meta: { totalCount, pageSize, currentPage: page }
        });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to fetch customers' }, { status: 500 });
    }
}

// --- POST (Create) ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const rawData = {
            name: formData.get('name') as string,
            customerCode: formData.get('customerCode') as string, 
            email: formData.get('email') as string || undefined,
            phone: formData.get('phone') as string,
            status: formData.get('status') as string,
        };

        // Now validation will succeed because customerCode is present
        const validation = CustomerSchema.safeParse(rawData);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Validation failed', 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }

        const photoFile = formData.get('photo') as File | null;
        const aggreFile = formData.get('aggrePaper') as File | null;

        const photoUrl = await saveFile(photoFile, 'photos');
        const aggreUrl = await saveFile(aggreFile, 'agreements');

        const newCustomer = await prisma.customer.create({
            data: {
                name: validation.data.name,
                customerCode: validation.data.customerCode,
                email: validation.data.email ?? '',
                phone: validation.data.phone,
                status: validation.data.status,
                photo: photoUrl || '',
                aggrePaper: aggreUrl || '',
            }
        });

        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- PUT (Update) ---
export async function PUT(request: Request) {
    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        // 1. Get existing record to find old file paths
        const existingCustomer = await prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        // 2. Prepare data for Zod validation (Matches POST logic)
        const rawData = {
            name: formData.get('name') as string,
            customerCode: formData.get('customerCode') as string,
            email: formData.get('email') as string || undefined,
            phone: formData.get('phone') as string, // Keep as string for BD leading zero
            status: formData.get('status') as string,
        };

        const validation = CustomerSchema.safeParse(rawData);
        if (!validation.success) {
            return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
        }

        // 3. Handle Files
        const photoFile = formData.get('photo') as File | null;
        const aggreFile = formData.get('aggrePaper') as File | null;

        const photoUrl = await saveFile(photoFile, 'photos');
        const aggreUrl = await saveFile(aggreFile, 'agreements');

        // 4. Build update object
        const updateData: any = {
            ...validation.data,
            email: validation.data.email ?? '',
        };

        // 5. If a NEW photo is uploaded, delete the OLD one
        if (photoUrl) {
            await deleteOldFile(existingCustomer.photo);
            updateData.photo = photoUrl;
        }

        // 6. If a NEW agreement is uploaded, delete the OLD one
        if (aggreUrl) {
            await deleteOldFile(existingCustomer.aggrePaper);
            updateData.aggrePaper = aggreUrl;
        }

        const updated = await prisma.customer.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Update failed' }, { status: 500 });
    }
}

// --- DELETE ---
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const customer = await prisma.customer.findUnique({ where: { id } });

        if (customer) {
            await deleteOldFile(customer.photo);
            await deleteOldFile(customer.aggrePaper);
            await prisma.customer.delete({ where: { id } });
        }

        return NextResponse.json({ message: 'Customer and files deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
    }
}

