export type ExpenseHead = {
  id: string;
  title: string;
  description?: string;
  _count?: {
    expenses: number;
  };
  createdAt: Date;
  updatedAt: Date;
}