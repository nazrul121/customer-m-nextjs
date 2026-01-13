import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SetupBillSchema } from '@/lib/schemas';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Define params as a Promise
) {
  try {
    // 1. Await the params to get the ID
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 2. Add a check to ensure ID exists
    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const payments = await prisma.customerService.findUnique({
      where: { id },
      include: {
        setupBills: {
          orderBy: {
            paidDate: 'desc',
          },
        },
        service: {
          select: {
            name: true,
          }
        },
      },
    });

    if (!payments) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("Prisma Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}



// --- POST (Create) ---
export async function POST(request: Request) {
    try {
        // 1. Parse JSON body (matching your frontend fetch call)
        const body = await request.json();

        // 2. Validate with Zod
        const validation = SetupBillSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Validation failed', 
                errors: validation.error.flatten() 
            }, { status: 400 });
        }

        const data = validation.data;

        // 4. Create the new record
        const newSetupBill = await prisma.setupBill.create({
            data: {
                customerServiceId: data.customerServiceId,
                paidAmount:data.paidAmount,
                paidDate:data.paidDate,
                receivedBy:data.receivedB
            }
        });

        return NextResponse.json({
            message: 'Subscription created successfully',
            data: newSetupBill
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST Error:', error);
        return NextResponse.json({ 
            message: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}



// --- DELETE ---
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const customerService = await prisma.customerService.findUnique({ where: { id } });

        if (customerService) {
            await prisma.customerService.delete({ where: { id } });
        }

        return NextResponse.json({ message: 'Customer subscription deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
    }
}

