// lib/utils.ts
import { format } from 'date-fns';

export function formatHumanReadableDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";
  
  // Correcting your month format: 'mm' is minutes, 'MM' is months
  const formatString = "dd/MM/yyyy 'at' hh:mm a";
  return format(date, formatString);
}