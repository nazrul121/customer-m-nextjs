import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MonthlyBillSchema } from '@/lib/schemas';
import {generateVoucherNo}  from "@/lib/utils";
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // -------------------------
    // 1. Month parsing (YYYY-MM)
    // -------------------------
    const month = searchParams.get("month") || "2026-01";
    const [year, monthNum] = month.split("-").map(Number);

    // Local time boundaries (NO UTC)
    const startOfMonth = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    // -------------------------
    // 2. Pagination & Search
    // -------------------------
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search") || "";

    // -------------------------
    // 3. WHERE clause (ACTIVE services in month)
    // -------------------------
    const where: any = {
      AND: [
        {
          startDate: {
            lte: endOfMonth, // started before month ends
          },
        },
        {
          expiryDate: {
            gte: startOfMonth, // ends after month starts
          },
        },
        {
          mmc: {
            gt: 0, // customerService.mmc > 0
          },
        },
      ],
    };

    // -------------------------
    // 4. Search filter
    // -------------------------
    if (search) {
      where.AND.push({
        OR: [
          { customer: { name: { contains: search } } },
          { customer: { customerCode: { contains: search } } },
          { service: { name: { contains: search} } },
        ],
      });
    }

    // -------------------------
    // 5. Sorting
    // -------------------------
    const sortId = searchParams.get("sortId") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    let orderBy: any = { [sortId]: sortDir };
    if (sortId === "customer") orderBy = { customer: { name: sortDir } };
    if (sortId === "service") orderBy = { service: { name: sortDir } };

    // -------------------------
    // 6. Query + Count
    // -------------------------
    const [data, totalCount] = await prisma.$transaction([
      prisma.customerService.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          customer: true,
          service: {
            include: {
              serviceType: true,
            },
          },
          // Optional: show bills for selected month (does NOT filter services)
          bills: {
            where: {
              monthFor: month
            },
          },
        },
      }),
      prisma.customerService.count({ where }),
    ]);

    // -------------------------
    // 7. Response
    // -------------------------
    return NextResponse.json({
      data,
      meta: {
        totalCount,
        page,
        pageSize,
        month,
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers()});
        if (!session) { return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); }

        const body = await request.json();
        const validated = MonthlyBillSchema.parse(body);

        // Execute everything in a transaction for data integrity
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Fetch data using 'tx' to lock the record 
            const service = await tx.customerService.findUnique({
                where: { id: validated.customerServiceId },
                include: {
                    bills: {
                        where: { monthFor: validated.monthFor}
                    }
                }
            });

            if (!service) throw new Error("Service not found");

            // 2. Logic Check // here bills = monthly_bill
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
            const monthlyBill = await tx.monthlyBill.create({
                data: {
                    customerServiceId: validated.customerServiceId,
                    monthFor: validated.monthFor,
                    mmc: validated.mmc,
                    paidAmount: validated.paidAmount,
                    paidDate: validated.paidDate,
                    receivedBy: session.user.name, // Use session name
                }
            });

          
            // 5. generate a ladger to get payment against
            const billingDate = new Date(`${validated.monthFor}-01`);
            const year = billingDate.getFullYear();
            const month = String(billingDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const formattedMonthFor = `${year}-${month}`; // Result: "2026-01"

            // Check if a Debit for this month's bill already exists
            const existingDebit = await tx.monthlyBill.findFirst({
                where: {
                    customerServiceId: validated.customerServiceId,
                    monthFor: formattedMonthFor, // 🔑 Now matches the DB format
                }
            });

            if (!existingDebit) {
                const voucherNoBill = await generateVoucherNo(tx);
                await tx.generalLedger.create({
                    data: {
                        purpose: 'MonthlyBill',
                        voucherNo: voucherNoBill,
                        voucherDate: billingDate, // Set to the 1st of the month
                        customerServiceId: validated.customerServiceId,
                        creditAmount: 0,
                        debitAmount: mmc,
                        receivedBy: 'SYSTEM', 
                        monthlyBillId:monthlyBill.id
                    }
                });
            }

            // 5.1 save payment ledger
            const voucherNo2 = await generateVoucherNo(tx);
            await tx.generalLedger.create({
                data: {
                    purpose: 'MonthlyBill',
                    voucherNo: voucherNo2,
                    voucherDate: validated.paidDate,
                    customerServiceId: validated.customerServiceId,
                    creditAmount: validated.paidAmount,
                    receivedBy: session.user.name,
                    monthlyBillId:monthlyBill.id
                }
            });

            return monthlyBill; // 🔑 Return this so it's assigned to 'result'
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