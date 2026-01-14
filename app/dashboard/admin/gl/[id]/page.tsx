import { Metadata } from "next";
import GLDetailContent from "./components";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>; // 🔑 Mark params as a Promise
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 🔑 Await the params to get the actual ID
  const { id } = await params;

  if (!id) return { title: 'Ledger Statement' };

  const service = await prisma.customerService.findUnique({
    where: { id: id },
    include: { customer: true },
  });

  return {
    title: service?.customer?.name 
      ? `Ledger for ${service.customer.name}` 
      : 'Ledger Statement',
  };
}

export default async function GLDetailPage({ params }: Props) {
  // 🔑 Await the params here as well
  const { id } = await params;

  return (
    <div>
      <GLDetailContent customerServiceId={id} />
    </div>
  );
}