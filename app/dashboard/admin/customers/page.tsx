import { Metadata } from "next";
import CustomerCrud from "./components";

export const metadata: Metadata = {
  title: 'Customer page',
  description: 'Manage application users and roles.',
};

export default function CustomersPage() {

  return (
    <>
      <CustomerCrud />
    </>
  );
}