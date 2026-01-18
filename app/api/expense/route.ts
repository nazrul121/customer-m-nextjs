import { NextResponse } from 'next/server';
import { ExpenseSchema } from '@/lib/schemas';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// --- GET (Read All) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    const searchTerm = searchParams.get('search') || '';
    const monthFilter = searchParams.get('month'); // Expects "YYYY-MM"

    const whereClause: any = {};

    // --- 1. Month Filtering Logic ---
    if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month
      whereClause.expenseDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (searchTerm) {
      whereClause.OR = [
        { note: { contains: searchTerm, mode: 'insensitive' } },
        { expenseHead: { title: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // --- 2. Summary Logic (ExpenseHead-wise) ---
    const summaryData = await prisma.expense.groupBy({
      by: ['expenseHeadId'],
      where: whereClause,
      _sum: { cost: true },
    });

    // Fetch titles for the IDs
    const heads = await prisma.expenseHead.findMany({
        where: { id: { in: summaryData.map(s => s.expenseHeadId) } },
        select: { id: true, title: true }
    });

    const summary = summaryData.map(item => ({
        title: heads.find(h => h.id === item.expenseHeadId)?.title || 'Unknown',
        total: item._sum.cost || 0
    }));

    // --- 3. Main Data Fetch ---
    const [expenses, totalCount] = await prisma.$transaction([
      prisma.expense.findMany({
        where: whereClause,
        include: { 
          expenseHead: true, 
          expenseBy: { select: { name: true } } 
        },
        skip: skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.count({ where: whereClause }),
    ]);
    
    return NextResponse.json({ 
      data: expenses, 
      summary, // 🔑 Added summary to response
      meta: { totalCount, pageSize, currentPage: page }
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get the session of the logged-in user
    // Note: Adjust 'auth.api.getSession' based on your specific auth library
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const json = await request.json();
    const validation = ExpenseSchema.safeParse(json);
    
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }

    const { expenseDate, cost, expenseHeadId, note } = validation.data;

    const newRow = await prisma.expense.create({
        data: { 
          expenseDate, 
          cost, 
          expenseHeadId,
          note: note || '',
          expenseById: session.user.id, // 🔑 ID comes from session, not the first user in DB
        }, 
        include: { expenseHead: true, expenseBy: true }
    });

    return NextResponse.json(newRow, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, ...rest } = await request.json();
    const validation = ExpenseSchema.partial().safeParse(rest);
    
    if (!validation.success) return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });

    const updated = await prisma.expense.update({
      where: { id },
      data: validation.data,
      include: { expenseHead: true, expenseBy: true }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete expense' }, { status: 500 });
  }
}