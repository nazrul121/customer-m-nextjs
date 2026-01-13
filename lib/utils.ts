// lib/utils.ts
import { Prisma } from '@/generated/prisma/client';
import { format } from 'date-fns';


export function formatHumanReadableDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  // Check if it's midnight in Local time
  const isLocalMidnight = 
    date.getHours() === 0 && 
    date.getMinutes() === 0 && 
    date.getSeconds() === 0;

  // Check if it's midnight in UTC time (common for ISO strings)
  const isUTCMidnight = 
    date.getUTCHours() === 0 && 
    date.getUTCMinutes() === 0 && 
    date.getUTCSeconds() === 0;

  // If either is true, we treat it as a "Date Only" input
  const hasNoTime = isLocalMidnight || isUTCMidnight;

  const formatString = hasNoTime 
    ? "dd/MM/yyyy" 
    : "dd/MM/yyyy 'at' hh:mm a";

  return format(date, formatString);
}

export async function generateVoucherNo(tx: Prisma.TransactionClient) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
    
    // Count existing records to determine the next number
    const count = await tx.generalLedger.count();
    
    // Pad numbers to 4 digits (e.g., 0001, 0025)
    const sequence = (count + 1).toString().padStart(4, '0');

    return `${year}-${month}-${sequence}`;
}