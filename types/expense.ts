// @/types/service.ts
export type Expense = {
  id: string;
  expenseDate: string;
  cost?: number; 
  note: string;
  expenseHeadId: string;
  expenseHead?: {
    id: string;
    title: string;
  };
  expenseById: string;
  expenseBy: {
    id: string;
    name: string; 
  };
  createdAt: Date;
  updatedAt: Date;
}