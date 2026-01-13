import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MonthlyBillSchema } from '@/lib/schemas';
import {generateVoucherNo}  from "@/lib/utils";
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    const searchTerm = searchParams.get('search') || '';
    
    // --- 3. Build the Relational Search ---
    const whereClause: any = {};

    if (searchTerm) {
      whereClause.OR = [
        // Search by Voucher Number
        { voucherNo: { contains: searchTerm, mode: 'insensitive' } },
        // Search by Purpose (MonthlyBill, SetupBill, etc.)
        { purpose: { contains: searchTerm, mode: 'insensitive' } },
        // 🔑 Deep Search: Search by Customer Name inside the relation
        {
          customerService: {
            customer: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        },
        // 🔑 Deep Search: Search by Customer Phone
        {
          customerService: {
            customer: {
              phone: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    // --- 4. Sorting Parameters ---
    const sortId = searchParams.get('sortId');
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc';
    
    let orderByClause: any = {};

    // Handle relational sorting if needed, otherwise default to model fields
    if (sortId && (sortDir === 'asc' || sortDir === 'desc')) {
        orderByClause[sortId] = sortDir;
    } else {
        orderByClause.createdAt = 'desc'; 
    }

    // --- 5. Fetch Data with Deep Includes ---
    const [generalLedgers, totalCount] = await prisma.$transaction([
      prisma.generalLedger.findMany({
        where: whereClause,
        include: {
          customerService: {
            include: {
              customer: true,
              service: {
                include: {
                  serviceType: true
                }
              }
            }
          } 
        },
        skip: skip,
        take: pageSize,
        orderBy: orderByClause,
      }),
      prisma.generalLedger.count({ 
        where: whereClause 
      }),
    ]);
    
    return NextResponse.json({ 
      data: generalLedgers, 
      meta: { 
        totalCount, 
        pageSize, 
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching generalLedger:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch data',
      error: error.message 
    }, { status: 500 });
  }
}