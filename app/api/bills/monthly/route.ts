import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MonthlyBillSchema } from '@/lib/schemas';


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month') || '2026-01'; // e.g., "2026-01"
        
        // 1. Calculate boundaries for the selected month
        // First day of selected month: 2026-01-01
        const startOfMonth = new Date(`${month}-01T00:00:00Z`);
        // Last day of selected month
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const skip = (page - 1) * pageSize;
        const search = searchParams.get('search') || '';

        // 2. Updated Where Clause
        const where: any = {
            AND: [
                // 🔑 Validity Check:
                // Start date must be before or during this month
                { startDate: { lte: endOfMonth } },
                // Expiry date must be after or during this month
                { expiryDate: { gte: startOfMonth } }
            ]
        };

        // 3. Add Search if present
        if (search) {
            where.AND.push({
                OR: [
                    { customer: { name: { contains: search } } },
                    { customer: { customerCode: { contains: search } } },
                    { service: { name: { contains: search } } },
                ],
            });
        }

        // ... sorting logic remains the same ...
        const sortId = searchParams.get('sortId') || 'createdAt';
        const sortDir = searchParams.get('sortDir') || 'desc';
        let orderBy: any = { [sortId]: sortDir };
        if (sortId === 'customer') orderBy = { customer: { name: sortDir } };
        if (sortId === 'service') orderBy = { service: { name: sortDir } };

        const [data, totalCount] = await prisma.$transaction([
            prisma.customerService.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
                include: {
                    customer: true,
                    service: { include: { serviceType: true } },
                    bills: {
                        where: { monthFor: month } // Still fetch existing bills for this month
                    }
                },
            }),
            prisma.customerService.count({ where })
        ]);

        return NextResponse.json({ data, meta: { totalCount } });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = MonthlyBillSchema.parse(body);

        // 1. Fetch the CustomerService to get the MMC and existing payments for that month
        const service = await prisma.customerService.findUnique({
            where: { id: validated.customerServiceId },
            include: {
                bills: {
                    where: { monthFor: validated.monthFor }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }

        // 2. Calculate current status for the specific month in the form
        const totalPaidSoFar = service.bills.reduce((sum, b) => sum + Number(b.paidAmount), 0);
        const mmc = Number(service.mmc);
        const remainingDue = mmc - totalPaidSoFar;

        // 3. Validation Logic
        if (remainingDue <= 0) {
            // 1. Create a date object from the "YYYY-MM" string
            const dateObj = new Date(`${validated.monthFor}-01`);
            
            // 2. Format it to "Month Year" (e.g., February 2026)
            const formattedDate = dateObj.toLocaleString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });

            console.log(`${formattedDate} is already fully paid.`);

            return NextResponse.json(
                { message: `${formattedDate} is already fully paid.` }, 
                { status: 400 }
            );
        }

        if (validated.paidAmount > remainingDue) {
            return NextResponse.json(
                { message: `Payment exceeds remaining due for ${validated.monthFor}. Max allowed: ${remainingDue}` }, 
                { status: 400 }
            );
        }

        // 4. If validation passes, create the payment record
        const payment = await prisma.monthlyBill.create({
            data: {
                customerServiceId: validated.customerServiceId,
                monthFor: validated.monthFor,
                mmc: validated.mmc,
                paidAmount: validated.paidAmount,
                paidDate: validated.paidDate,
                receivedBy: body.receivedBy || "Admin",
            }
        });

        return NextResponse.json(payment);
    } catch (error: any) {
        console.error("Payment Error:", error);
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}