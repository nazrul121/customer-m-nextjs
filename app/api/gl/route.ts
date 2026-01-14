import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    const searchTerm = searchParams.get('search') || '';

    // Search logic: allows searching by customer name, phone, or service name
    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { customer: { name: { contains: searchTerm } } },
        { customer: { phone: { contains: searchTerm } } },
        { service: { name: { contains: searchTerm } } },
      ];
    }

    const [services, totalCount] = await prisma.$transaction([
      prisma.customerService.findMany({
        where: whereClause,
        include: {
          customer: true,
          service: true,
          generalLedgers: true, // Fetching entries for calculation
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerService.count({ where: whereClause }),
    ]);

    // --- Data Transformation ---
    const dataWithSummary = services.map((cs) => {
      const totalDebit = cs.generalLedgers.reduce((sum, gl) => sum + Number(gl.debitAmount || 0), 0);
      const totalCredit = cs.generalLedgers.reduce((sum, gl) => sum + Number(gl.creditAmount || 0), 0);
      
      return {
        id: cs.id,
        customerName: cs.customer.name,
        customerPhone: cs.customer.phone,
        serviceName: cs.service.name,
        totalBilled: totalDebit,
        totalPaid: totalCredit,
        balance: totalDebit - totalCredit,
        ledgerCount: cs.generalLedgers.length,
        // We pass the full cs object or just the ID for the "More" button
        customerServiceId: cs.id 
      };
    });

    return NextResponse.json({
      data: dataWithSummary,
      meta: { totalCount, pageSize, currentPage: page }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}