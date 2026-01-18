import { NextResponse } from 'next/server';
import { CustomerSchema } from '@/lib/schemas';
import prisma from '@/lib/prisma';
import { auth } from "@/lib/auth";
import { deleteOldFile, saveFile } from '@/lib/file-storage';


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
        { name: { contains: searchTerm} },
        { email: { contains: searchTerm} },
      ];
    }

    const sortId = searchParams.get('sortId') || 'createdAt';
    const sortDir = searchParams.get('sortDir') || 'desc';

    const [customers, totalCount] = await prisma.$transaction([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { [sortId]: sortDir as 'asc' | 'desc' },

        // ⭐ ADD THIS
        include: {
          _count: {
            select: {
              services: true, // CustomerService[]
            },
          },
        },
      }),

      prisma.customer.count({ where: whereClause }),
    ]);

    // ⭐ Normalize response
    const formattedCustomers = customers.map((c) => ({
      ...c,
      servicesCount: c._count.services,
      _count: undefined, // optional: remove internal Prisma field
    }));

    return NextResponse.json({
      data: formattedCustomers,
      meta: {
        totalCount,
        pageSize,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}


// --- POST (Create) ---
export async function POST(request: Request) {
    let createdAuthUserId: string | null = null;

    try {
        const formData = await request.formData();
        
        // 1. Extract and Validate Raw Data
        const rawData = {
            name: formData.get('name') as string,
            customerCode: formData.get('customerCode') as string, 
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            status: formData.get('status') as string,
            role: formData.get('role') as string || 'customer',
            password: formData.get('password') as string || 'Welcome@123',
        };

        const validation = CustomerSchema.safeParse(rawData);
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Validation failed', 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }

        // --- NEW: PRE-SIGNUP VALIDATION ---
        // Check if Email or Phone already exists in the User table
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: validation.data.email },
                    { phoneNumber: validation.data.phone }
                ]
            }
        });

        if (existingUser) {
            const field = existingUser.email === validation.data.email ? 'Email' : 'Phone number';
            return NextResponse.json({ 
                message: `${field} is already registered to another account.` 
            }, { status: 409 });
        }
        // ----------------------------------

        // 2. Handle File Uploads
        const photoFile = formData.get('photo') as File | null;
        const aggreFile = formData.get('aggrePaper') as File | null;
        const photoUrl = await saveFile(photoFile, 'photos');
        const aggreUrl = await saveFile(aggreFile, 'agreements');

        // 3. Create User via Better-Auth
        // Now much safer because we checked for existing users above
        const authResponse = await auth.api.signUpEmail({
            body: {
                email: validation.data.email,
                phoneNumber: validation.data.phone,
                password: rawData.password,
                name: validation.data.name,
            },
        });

        if (!authResponse || !authResponse.user) {
            throw new Error("Authentication service refused to create account.");
        }

        createdAuthUserId = authResponse.user.id;

        // 4. Prisma Transaction
        const result = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: createdAuthUserId! },
                data: {
                    role: rawData.role,
                    status: validation.data.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    phoneNumber: validation.data.phone,
                }
            });

            const newCustomer = await tx.customer.create({
                data: {
                    name: validation.data.name,
                    customerCode: validation.data.customerCode,
                    email: validation.data.email,
                    phone: validation.data.phone,
                    status: validation.data.status as any,
                    photo: photoUrl || '',
                    aggrePaper: aggreUrl || '',
                    userId: updatedUser.id,
                }
            });

            return { customer: newCustomer, user: updatedUser };
        });

        return NextResponse.json({
            message: 'Customer account created successfully',
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("POST Error:", error);

        if (createdAuthUserId) {
            await prisma.user.delete({ where: { id: createdAuthUserId } }).catch(() => {
                console.error("Cleanup failed: Could not delete orphan user.");
            });
        }

        return NextResponse.json({ 
            message: error.message || 'Internal Server Error' 
        }, { status: 500 });
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

