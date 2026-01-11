export type MonthlyBill = {
    id: string;
    customerServiceId: string;
    monthFor: Date;
    mmc: number;
    paidAmount: number;
    paidDate:Date;
    receivedBy:String;
    createdAt: Date;
    updatedAt: Date;
}