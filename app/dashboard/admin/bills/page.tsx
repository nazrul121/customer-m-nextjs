import { Metadata } from "next";
import BillCrud from "./components";

export const metadata: Metadata = {
  title: 'Monthly billing page',
  description: 'Get due/collection of a month',
};

export default function ServicesPage() {
  return (
    <>
      <BillCrud />
    </>
  );
}