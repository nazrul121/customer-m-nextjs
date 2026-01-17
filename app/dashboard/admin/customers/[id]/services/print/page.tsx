// app/dashboard/admin/customers/[id]/services/print/page.tsx
import prisma from "@/lib/prisma";
import { formatHumanReadableDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { MapPin, Phone, Globe, Calendar, Hash, ShieldCheck } from "lucide-react";
import PrintButton from "./PrintButton";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ serviceId?: string; setupbill?: string }>;
}

export default async function PremiumInvoicePage({ params, searchParams }: Props) {
  const { id: customerId } = await params;
  const { serviceId, setupbill: setupBillId } = await searchParams;

  if (!serviceId || !setupBillId) return notFound();

  const data = await prisma.setupBill.findUnique({
    where: { id: setupBillId },
    include: {
      customerService: {
        include: {
          customer: true,
          service: { include: { serviceType: true } },
          generalLedgers: {
            where: { creditAmount: { gt: 0 } },
            orderBy: { voucherNo: "asc" },
          },
        },
      },
    },
  });

  if (!data) return notFound();

  const { customer, service, generalLedgers } = data.customerService;
  const currentLedger = generalLedgers.find((l) => l.setupBillId === setupBillId);
  const currentVoucherNo = currentLedger?.voucherNo || "N/A";

  const currentPayment = Number(data.paidAmount);
  const initCost = Number(data.customerService.initCost);

  const previousPaidAmount = generalLedgers
    .filter((l) => l.voucherNo < currentVoucherNo)
    .reduce((acc, curr) => acc + Number(curr.creditAmount), 0);

  const totalPaidSoFar = previousPaidAmount + currentPayment;
  const balanceDue = initCost - totalPaidSoFar;

  return (
    <div className="invoice-wrapper min-h-screen bg-slate-100 py-10 font-sans print:bg-white print:p-0 print:m-0">
      {/* Action Bar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center px-4 no-print">
        <h1 className="text-xl font-bold text-slate-700">Invoice Preview</h1>
        <PrintButton />
      </div>

      {/* A4 Page Container */}
      <div
        id="printable-invoice"
        className="mx-auto bg-white shadow-2xl w-[210mm] h-[297mm] p-[15mm] text-slate-800 flex flex-col justify-between relative print:shadow-none print:w-full print:h-[100vh] print:max-h-[100vh] print:m-0 print:p-[12mm] print:absolute print:top-0 print:left-0"
      >
        {/* Top Content Wrapper */}
        <div className="w-full">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="text-primary" size={32} />
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                  Micro <span className="text-primary">Datasoft</span>
                </h2>
              </div>
              <div className="text-[11px] space-y-1 mt-2 font-bold text-slate-500 uppercase tracking-wider">
                <p className="flex items-center gap-2"><MapPin size={12} /> House #7, Road #12, Mirpur - 12, Dhaka</p>
                <p className="flex items-center gap-2"><Phone size={12} /> +880 1XXX-XXXXXX</p>
                <p className="flex items-center gap-2"><Globe size={12} /> www.microdatasoft.com</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-5xl font-black uppercase tracking-tighter text-slate-100 leading-none mb-4">
                Invoice
              </h3>
              <p className="font-bold text-xl flex items-center justify-end gap-1 text-slate-900">
                <Hash size={18} className="text-primary" /> {currentVoucherNo}
              </p>
              <p className="text-[11px] font-black flex items-center justify-end gap-1 mt-1 text-slate-400 uppercase tracking-widest">
                <Calendar size={12} /> {formatHumanReadableDate(data.paidDate || data.createdAt)}
              </p>
            </div>
          </div>

          {/* Client & Transaction Info */}
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-3">Billed To</p>
              <p className="font-bold text-lg text-slate-900 leading-tight">{customer.name}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{customer.phone}</p>
              <p className="text-[10px] font-mono bg-white inline-block px-2 py-1 rounded border border-slate-200 mt-4 text-slate-400">
                CUSTOMER ID: {customer.customerCode}
              </p>
            </div>
            <div className="text-right flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Service Package</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{service.name}</p>
              <p className="text-xs font-bold text-primary mt-1 uppercase italic">Collector: {data.receivedBy}</p>
              <div className={`mt-4 inline-block ml-auto px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border-2 ${
                  balanceDue <= 0 ? "border-success text-success bg-success/5" : "border-warning text-warning bg-warning/5"
                }`}>
                {balanceDue <= 0 ? "Account Settled" : "Payment Pending"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-slate-100 overflow-hidden mb-8">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-[0.2em]">
                <tr>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-8 px-6">
                    <p className="font-bold text-slate-900 text-lg">Initial Setup & Activation</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">
                      Professional hardware installation, fiber-optic configuration, and service provisioning.
                    </p>
                  </td>
                  <td className="py-8 px-6 text-right font-black text-2xl text-slate-900">
                    ৳{initCost.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pr-4">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Total Contract Value</span>
                <span className="text-slate-900">৳{initCost.toLocaleString()}</span>
              </div>
              {previousPaidAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Previously Paid</span>
                  <span className="text-slate-600">- ৳{previousPaidAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-success py-2 border-b-2 border-slate-50">
                <span className="uppercase tracking-widest">Received Today</span>
                <span>৳{currentPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-black uppercase text-[10px] text-slate-300 tracking-[0.3em]">Closing Balance</span>
                <span className="font-black text-2xl tracking-tighter">
                  ৳{balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center border-t border-slate-100 pt-8 pb-4 mt-auto">
          <p className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Micro Datasoft Limited</p>
          <div className="flex items-center justify-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
            <span>Verified Official Receipt</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
            <span>Computer Generated Document</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* 1. Hide everything by default */
          body * { 
            visibility: hidden; 
          }

          /* 2. Target the specific invoice and its hierarchy */
          #printable-invoice, #printable-invoice * { 
            visibility: visible; 
          }

          /* 3. Force the Body to be exactly one A4 page with NO overflow */
          html, body {
            height: 297mm !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; /* This stops the second page generation */
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 4. Position the invoice to fill the exact dimensions */
          #printable-invoice {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important; /* Critical: Hard limit on height */
            margin: 0 !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
            
            /* New: Force the browser to treat this as a single graphical layer */
            contain: layout size !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /* 5. Remove browser-specific artifacts */
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          /* 6. Fix for Lucide icons causing extra height */
          svg {
            display: inline-block !important;
            vertical-align: middle !important;
            break-inside: avoid !important;
          }
          
          /* 7. Final fail-safe: Hide the action bar entirely */
          .no-print {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
        }
      `}} />
    </div>
  );
}