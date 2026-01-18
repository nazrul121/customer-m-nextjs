import ExpenseCrud from "./components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Expance page',
  description: 'Manage application users and roles.',
};

export default function ExpensePage() {
  return (
    <>
      <ExpenseCrud />
    </>
  );
}