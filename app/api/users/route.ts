// app/api/users/route.ts
import { NextResponse } from 'next/server'
import { userSchema } from '@/lib/schemas'
import { Prisma } from '@/generated/prisma/client' 
import prisma from '@/lib/prisma';
import { phoneNumber } from 'better-auth/plugins';
import { auth } from "@/lib/auth";

// --- GET (Read All Users) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

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
        { name:  { contains: searchLower} },
        { email: { contains: searchLower} },
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
    const [users, totalCount] = await prisma.$transaction([
      // A) Fetch the users for the current page
      prisma.user.findMany({
        where: whereClause,
        skip: skip,
        take: pageSize,
        orderBy: orderByClause,
      }),
      // B) Count the total number of records matching the search filter
      prisma.user.count({ where: whereClause }),
    ]);
    
    // --- 5. Return Data with Total Count ---
    return NextResponse.json({ 
      data: users, 
      meta: { totalCount,  pageSize,  currentPage: page }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

// --- POST (Create a New User) ---
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. Validate with Zod
    const validationResult = userSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phoneNumber, password } = validationResult.data;

    // 2. Manual check for existing user (Optional, Better-Auth does this too)
    const existingUser = await prisma.user.findFirst({
        where: {
          OR: [ { email: email }, { phoneNumber: phoneNumber }]
        }
    });
    if (existingUser) {
        const conflictField = existingUser.email === email ? 'email' : 'phone number';
        return NextResponse.json(
            { message: `The ${conflictField} is already registered.` },
            { status: 409 } 
        );
    }

    // 3. Use the Better-Auth Server API
    // Note: We use auth.api.signUpEmail directly on the server
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password: password || "12345678!", // You MUST provide a password
        name,
        phoneNumber, // Ensure this is enabled in your Better-Auth config additionalFields
      },
    });

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });

  } catch (error: any) {
    // Better-Auth throws specific errors (like "USER_ALREADY_EXISTS")
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create user' }, 
      { status: 500 }
    );
  }
}

// --- PUT (Update an Existing User) ---
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    // 🔑 Added 'status' to destructuring
    const { id, name, email, role, status } = data;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'A valid User ID is required' }, { status: 400 });
    }

    // 🔑 Include 'status' in validation
    const updateData = userSchema.partial().safeParse({ name, email, role, status });
    
    if (!updateData.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: updateData.error.flatten() },
        { status: 400 }
      );
    }

    // Data to be updated
    const validatedData = updateData.data;

    // Uniqueness Check
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { message: `The email "${validatedData.email}" is already registered.` },
          { status: 409 }
        );
      }
    }
    
    // Perform update
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        phoneNumber: validatedData.phoneNumber,
        status: validatedData.status as any, 
      },
    })

    return NextResponse.json(updatedUser, { status: 200 });
    
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE (Delete a User) ---

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // 1. Correct Type Check: Prisma IDs are Strings, not Numbers
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'A valid User String ID is required' }, { status: 400 });
    }

    // 2. Security Check: Ensure the person deleting is an Admin (Optional but Recommended)
    // const session = await auth.api.getSession({ headers: request.headers });
    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    // }

    // 3. Check if user exists before deleting to avoid Prisma errors
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 4. Delete the user
    // Because your schema has 'onDelete: Cascade', 
    // this will automatically remove Sessions and Accounts.
    await prisma.user.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}