import ServiceTypeCrud from "./typeComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Service Type page',
  description: 'Manage application users and roles.',
};

export default function ServicesPage() {

  return (
    <>
      <ServiceTypeCrud />
    </>
  );
}