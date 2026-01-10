import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import CustomerServicesClient from './components'; // Adjust path if needed
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { name: true, customerCode: true }
  });
  if (!customer) return { title: 'Customer Not Found' };
  return { title: `Services - ${customer.name}` };
}

export default async function CustomerServicesPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ 
    where: { id } 
  });

  if (!customer) notFound();

  // 🔑 Convert Prisma object to a plain JSON-serializable object
  // This handles the "Date" and "Decimal" serialization error
  const serializedCustomer = {
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    // If you have Decimals in your Customer model, convert them:
    // someDecimalField: customer.someDecimalField.toString(),
  };

  return (
    <div>
      <CustomerServicesClient customer={serializedCustomer as any} />
    </div>
  );
}