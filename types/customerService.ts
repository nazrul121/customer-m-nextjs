import { Customer } from "./customer";
import { Service } from "./service";

export type CustomerService = {
  bills: any;
  id: string;
  customerId: string;
  serviceId: string;
  
  initCost: number;      
  mmc: number;
  initCostDis: number;
  mmcDis: number;
  
  // Dates and Logic
  startDate: Date | string;
  expiryDate: Date | string;
  isRepeat: 'YES' | 'NO';

  customer?: Customer;
  service?: Service;

  createdAt: Date;
  updatedAt: Date;
}