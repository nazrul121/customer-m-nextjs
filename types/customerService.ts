import { Customer } from "./customer";
import { Service } from "./service";

export type CustomerService = {
  id: string;
  customerId: string;
  serviceId: string;
  
  // Pivot Data (Financials)
  initCost: number;       // Note: Prisma Decimal usually maps to number or string in TS
  mmc: number;
  initCostDis: number;
  mmcDis: number;
  
  // Dates and Logic
  startDate: Date | string;
  expiryDate: Date | string;
  isRepeat: 'YES' | 'NO'; // Based on your Prisma enum YesNo

  // Optional Relations (For when you use .include in Prisma)
  customer?: Customer;
  service?: Service;

  createdAt: Date;
  updatedAt: Date;
}