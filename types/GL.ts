export type GL = {
  customerService: any;
  id: string;
  customerServiceId : string;
  purpose:string;
  voucherNo:string;
  voucherDate:Date;
  debitAmount: number;
  creditAmount: number;
  receivedBy:String;
  createdAt: Date;
  updatedAt: Date;
}

export type GLSummary = {
  id: string; // The CustomerServiceId
  customerName: string;
  customerPhone: string;
  serviceName: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  ledgerCount: number;
  lastTransactionDate: Date | null;
};