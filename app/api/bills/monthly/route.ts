import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MonthlyBillSchema } from '@/lib/schemas';
import {generateVoucherNo}  from "@/lib/utils";
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = MonthlyBillSchema.parse(body);

        // Execute everything in a transaction for data integrity
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Fetch data using 'tx' to lock the record (concurrency safety)
            const service = await tx.customerService.findUnique({
                where: { id: validated.customerServiceId },
                include: {
                    bills: {
                        where: { monthFor: validated.monthFor }
                    }
                }
            });

            if (!service) throw new Error("Service not found");

            // 2. Logic Check
            const totalPaidSoFar = service.bills.reduce((sum, b) => sum + Number(b.paidAmount), 0);
            const mmc = Number(service.mmc);
            const remainingDue = mmc - totalPaidSoFar;

            if (remainingDue <= 0) {
                const dateObj = new Date(`${validated.monthFor}-01`);
                const formattedDate = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                throw new Error(`${formattedDate} is already fully paid.`);
            }

            if (validated.paidAmount > remainingDue) {
                throw new Error(`Payment exceeds remaining due. Max allowed: ${remainingDue}`);
            }

            // 3. Generate Voucher (using tx)
            const voucherNo = await generateVoucherNo(tx);

            // 4. Create Payment (Using 'tx', NOT 'prisma')
            const payment = await tx.monthlyBill.create({
                data: {
                    customerServiceId: validated.customerServiceId,
                    monthFor: validated.monthFor,
                    mmc: validated.mmc,
                    paidAmount: validated.paidAmount,
                    paidDate: validated.paidDate,
                    receivedBy: session.user.name, // Use session name
                }
            });

            // 5. Create General Ledger (Using 'tx')
            await tx.generalLedger.create({
                data: {
                    purpose: 'MonthlyBill',
                    receivedBy: session.user.name,
                    voucherNo: voucherNo,
                    customerServiceId: validated.customerServiceId,
                    paidAmount: validated.paidAmount,
                    paidDate: validated.paidDate,
                }
            });

            return payment; // 🔑 Return this so it's assigned to 'result'
        });

        return NextResponse.json({
            message: 'Payment recorded successfully',
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("Payment Error:", error);
        // Better-Auth and Prisma errors usually have a message property
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 400 });
    }
}