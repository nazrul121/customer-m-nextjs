import { Metadata } from "next";
import ExpenseHeadCrud from "./Component";

export const metadata: Metadata = {
  title: 'Expense Head page',
  description: 'Expense Head page.',
};

export default function ExpenseHead() {

  return (
    <>
      <ExpenseHeadCrud />
    </>
  );
}