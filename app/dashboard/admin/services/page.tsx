import ServiceCrud from "./components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Service page',
  description: 'Manage application users and roles.',
};

export default function ServicesPage() {
  return (
    <>
      <ServiceCrud />
    </>
  );
}