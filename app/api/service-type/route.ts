import { NextResponse } from 'next/server'
import { ServiceTypeSchema } from '@/lib/schemas'
import { Prisma } from '@/generated/prisma/client' 
import prisma from '@/lib/prisma';

// --- GET (Read All) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isSimple = searchParams.get('simple') === 'true';

    // If 'simple=true', skip pagination and search logic for dropdowns
    if (isSimple) {
      const list = await prisma.serviceType.findMany({
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      });
      return NextResponse.json(list, { status: 200 });
    }

    // --- 1. Pagination Parameters ---
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    // --- 2. Search Parameter ---
    const searchTerm = searchParams.get('search') || '';
    
    // 🔑 Convert search term to lowercase once for universal comparison
    const searchLower = searchTerm.toLowerCase().trim();

    // --- 3. Build the Prisma Query ---
    const whereClause: any = {};
    
    if (searchLower) {
      whereClause.OR = [
        { title:  { contains: searchLower} },
        { description: { contains: searchLower} },
      ];
    }

    // 🔑 Sorting Parameters
    const sortId = searchParams.get('sortId');
    const sortDir = searchParams.get('sortDir'); // 'asc' or 'desc'
    
    // 🔑 Prepare the orderBy clause
    const orderByClause: any = {};
    if (sortId && (sortDir === 'asc' || sortDir === 'desc')) {
      // Only apply sorting if we have both an ID and a valid direction
      orderByClause[sortId] = sortDir;
    } else {
      // Default sort order if none is provided
      orderByClause.createdAt = 'desc'; 
    }

    // --- 4. Fetch Data and Total Count ---
    const [service_types, totalCount] = await prisma.$transaction([
      prisma.serviceType.findMany({
        where: whereClause,
        skip: skip,
        take: pageSize,
        orderBy: orderByClause,
        include: {
          _count: {
            select: { services: true } // This counts how many services use this type
          }
        }
      }),
      // B) Count the total number of records matching the search filter
      prisma.serviceType.count({ where: whereClause }),
    ]);
    
    // --- 5. Return Data with Total Count ---
    return NextResponse.json({ 
      data: service_types, 
      meta: { totalCount,  pageSize,  currentPage: page }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching service types:', error);
    return NextResponse.json({ message: 'Failed to fetch service types' }, { status: 500 });
  }
}

// --- POST (Create ) ---
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. Validate with Zod
    const validationResult = ServiceTypeSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description} = validationResult.data;

    const existingType = await prisma.serviceType.findFirst({
        where: {
          OR: [ { title: title } ]
        }
    });
    if (existingType) {
        return NextResponse.json(
            { message: `The ${title} is already exist.` },
            { status: 409 } 
        );
    }

    const newRow = await prisma.serviceType.create({
        data: {title:title, description:description}, // TypeScript now correctly infers that 'categoryData' satisfies 'categoryCreateInput'
    })

    return NextResponse.json({ message: 'Service Type created successfully', newRow }, { status: 201 });

  } catch (error: any) {
    // Better-Auth throws specific errors (like "USER_ALREADY_EXISTS")
    console.error('Error creating Service Type:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create Service Type' }, 
      { status: 500 }
    );
  }
}

// --- PUT (Update an Existing) ---
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, title, description } = data

    // Partial validation for fields that are present
    const updateData = ServiceTypeSchema.partial().safeParse({ title, description })
    if (!updateData.success) {
        return NextResponse.json(
            { message: 'Validation failed', errors: updateData.error.flatten() },
            { status: 400 }
        )
    }
    const validatedData = updateData.data as { title?: string, description?: string };
    // Perform update
    const updatedType = await prisma.serviceType.update({
      where: { id: String(id) },
      data: validatedData,
    })
    return NextResponse.json(updatedType, { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: 'Service type not found.' }, { status: 404 });
    }
    console.error('Error updating service type:', error)
    return NextResponse.json({ message: 'Failed to update service type' }, { status: 500 })
  }
}

// --- DELETE ---

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // 1. Correct Type Check: Prisma IDs are Strings, not Numbers
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'A valid Column String ID is required' }, { status: 400 });
    }

    // 3. Check if user exists before deleting to avoid Prisma errors
    const row = await prisma.serviceType.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ message: 'Data not found' }, { status: 404 });
    }

    // 4. Delete the user
    // Because your schema has 'onDelete: Cascade', 
    // this will automatically remove Sessions and Accounts.
    await prisma.serviceType.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Data deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Failed to delete Data' }, { status: 500 });
  }
}