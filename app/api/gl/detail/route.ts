import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    const searchTerm = searchParams.get('search') || '';
    const customerServiceId = searchParams.get('customerServiceId'); // From your detail page

    // --- 1. Build the Where Clause ---
    const whereClause: any = {};
    if (customerServiceId) {
      whereClause.customerServiceId = customerServiceId;
    }

    if (searchTerm) {
      whereClause.OR = [
        { voucherNo: { contains: searchTerm } },
        { purpose: { contains: searchTerm } },
        { customerService: { customer: { name: { contains: searchTerm } } } },
        { customerService: { customer: { phone: { contains: searchTerm } } } },
      ];
    }

    // --- 2. Build Sorting ---
    const sortId = searchParams.get('sortId') || 'voucherNo';
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';
    let orderByClause: any = {};
    if (sortId === 'customer') {
      orderByClause = { customerService: { customer: { name: sortDir } } };
    } else {
      orderByClause[sortId] = sortDir;
    }

    // --- 3. Execute Transaction (Data, Count, and Aggregates) ---
    const [generalLedgers, totalCount, aggregates] = await prisma.$transaction([
      // Fetch paginated data
      prisma.generalLedger.findMany({
        where: whereClause,
        include: {
          customerService: {
            include: {
              customer: true,
              service: { include: { serviceType: true } }
            }
          },
          setupBill:true
        },
        skip,
        take: pageSize,
        orderBy: orderByClause,
      }),
      // Count total records
      prisma.generalLedger.count({ where: whereClause }),
      // 🔑 THE SUMMARY LOGIC: Aggregate all matching records
      prisma.generalLedger.aggregate({
        where: whereClause,
        _sum: {
          debitAmount: true,
          creditAmount: true,
        }
      })
    ]);

    // Calculate the total balance
    const totalDebit = Number(aggregates._sum.debitAmount || 0);
    const totalCredit = Number(aggregates._sum.creditAmount || 0);
    const totalBalance = totalDebit - totalCredit;

    return NextResponse.json({ 
      data: generalLedgers, 
      meta: { 
        totalCount, 
        pageSize, 
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        // 🔑 Include summary data in the meta
        summary: {
          totalDebit,
          totalCredit,
          totalBalance,
          status: totalBalance > 0 ? 'Due' : 'Settled'
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('MySQL Fetch Error:', error);
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}