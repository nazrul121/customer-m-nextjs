import { Metadata } from "next";
import RegisterContents from "./components";

export const metadata: Metadata = {
  title: 'Register page',
  description: 'Manage application users and roles.',
};

export default function RegisterPage() {
  return (
    <div>
        <RegisterContents />
    </div>
  );
}